import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/payments/stripe";
import { webhookEvents } from "@/lib/collections";
import { confirmBookingFromPayment, expirePendingFromPayment } from "@/lib/booking";

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

  // Idempotency — bail out if we've seen this event id before.
  const we = await webhookEvents();
  try {
    await we.insertOne({
      _id: new (await import("mongodb")).ObjectId(),
      provider: "stripe",
      externalId: event.id,
      receivedAt: new Date(),
    });
  } catch {
    return NextResponse.json({ ok: true, dedup: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const pendingBookingId = session.metadata?.pendingBookingId;
      if (!pendingBookingId) {
        console.warn("[webhooks/stripe] no pendingBookingId metadata");
        return NextResponse.json({ ok: true });
      }
      await confirmBookingFromPayment("stripe", session.id, {
        amount: session.amount_total ?? 0,
        currency: (session.currency ?? "usd").toUpperCase(),
      });
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await expirePendingFromPayment("stripe", session.id);
    }
  } catch (err) {
    console.error("[webhooks/stripe] handler error", err);
    // Returning 500 lets Stripe retry. Return 200 if we want to swallow.
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
