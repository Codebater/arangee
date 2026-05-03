import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { ObjectId } from "mongodb";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/payments/stripe";
import { users, webhookEvents } from "@/lib/collections";
import { confirmBookingFromPayment, expirePendingFromPayment } from "@/lib/booking";
import type { SubscriptionStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verify_failed";
    console.error("[webhooks/stripe] signature verify failed", msg);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const we = await webhookEvents();
  try {
    await we.insertOne({
      _id: new ObjectId(),
      provider: "stripe",
      externalId: event.id,
      receivedAt: new Date(),
    });
  } catch {
    return NextResponse.json({ ok: true, dedup: true });
  }

  try {
    const isConnect = Boolean(event.account);

    if (isConnect && event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const pendingBookingId = session.metadata?.pendingBookingId;
      if (!pendingBookingId) {
        console.warn("[webhooks/stripe] connect session missing pendingBookingId");
        return NextResponse.json({ ok: true });
      }
      await confirmBookingFromPayment("stripe", session.id, {
        amount: session.amount_total ?? 0,
        currency: (session.currency ?? "usd").toUpperCase(),
      });
    } else if (isConnect && event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await expirePendingFromPayment("stripe", session.id);
    } else if (!isConnect && event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handlePlatformCheckoutCompleted(session);
    } else if (
      !isConnect &&
      (event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated")
    ) {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(sub);
    } else if (!isConnect && event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await downgradeSubscription(sub);
    } else if (!isConnect && event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof (invoice as unknown as { subscription?: unknown }).subscription === "string"
          ? ((invoice as unknown as { subscription: string }).subscription)
          : null;
      if (subId) {
        await (await users()).updateOne(
          { "subscription.stripeSubscriptionId": subId },
          { $set: { "subscription.status": "past_due", updatedAt: new Date() } },
        );
      }
    }
  } catch (err) {
    console.error("[webhooks/stripe] handler error", err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handlePlatformCheckoutCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  if (kind === "donation") {
    const userIdRaw = session.metadata?.userId;
    if (!userIdRaw || !ObjectId.isValid(userIdRaw)) {
      console.warn("[webhooks/stripe] donation session without valid userId");
      return;
    }
    const amount = session.amount_total ?? 0;
    const currency = (session.currency ?? "eur").toUpperCase();
    if (amount <= 0) return;
    const col = await users();
    await col.updateOne(
      { _id: new ObjectId(userIdRaw) },
      [
        {
          $set: {
            "donations.totalCents": {
              $add: [{ $ifNull: ["$donations.totalCents", 0] }, amount],
            },
            "donations.currency": {
              $ifNull: ["$donations.currency", currency],
            },
            "donations.latest": {
              amount,
              currency,
              paidAt: new Date(),
            },
            updatedAt: new Date(),
          },
        },
      ],
    );
  }
  // Subscription checkout creates a customer.subscription.created event right
  // after which is what we use to flip the plan, so nothing else to do here.
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const status = sub.status as SubscriptionStatus;
  const subAny = sub as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const periodEndUnix = subAny.current_period_end ?? subAny.items?.data?.[0]?.current_period_end;
  const currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;
  const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
  const isActive = status === "active" || status === "trialing";

  const update: Record<string, unknown> = {
    "subscription.stripeCustomerId": customerId,
    "subscription.stripeSubscriptionId": sub.id,
    "subscription.status": status,
    "subscription.currentPeriodEnd": currentPeriodEnd,
    "subscription.cancelAtPeriodEnd": cancelAtPeriodEnd,
    updatedAt: new Date(),
  };
  if (isActive) update.plan = "pro";
  if (status === "canceled" || status === "incomplete_expired" || status === "unpaid") {
    update.plan = "free";
  }

  const col = await users();
  const userIdRaw = sub.metadata?.userId;
  let res;
  if (userIdRaw && ObjectId.isValid(userIdRaw)) {
    res = await col.updateOne({ _id: new ObjectId(userIdRaw) }, { $set: update });
  } else {
    res = await col.updateOne({ "subscription.stripeCustomerId": customerId }, { $set: update });
  }
  if (res.matchedCount === 0) {
    console.warn(`[webhooks/stripe] no user matched subscription ${sub.id} (cus=${customerId})`);
  }
}

async function downgradeSubscription(sub: Stripe.Subscription) {
  const col = await users();
  await col.updateOne(
    { "subscription.stripeSubscriptionId": sub.id },
    {
      $set: {
        plan: "free",
        "subscription.status": "canceled" as SubscriptionStatus,
        "subscription.cancelAtPeriodEnd": false,
        updatedAt: new Date(),
      },
    },
  );
}
