"use server";

import { requireUser } from "@/lib/auth-helpers";
import { users } from "@/lib/collections";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/payments/stripe";
import { donationAmountSchema } from "@/lib/validation";

async function ensureCustomer(args: {
  userId: string;
  email: string;
  name: string;
  existingId?: string;
}): Promise<string> {
  const stripe = getStripe();
  if (args.existingId) return args.existingId;
  const c = await stripe.customers.create({
    email: args.email,
    name: args.name,
    metadata: { userId: args.userId },
  });
  return c.id;
}

export async function startSubscription(): Promise<string> {
  const { user } = await requireUser();
  const e = env();
  if (!e.STRIPE_SECRET_KEY || !e.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!e.STRIPE_PRO_PRICE_ID) {
    throw new Error("STRIPE_PRO_PRICE_ID is not configured.");
  }
  const stripe = getStripe();
  const customerId = await ensureCustomer({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    existingId: user.subscription?.stripeCustomerId,
  });
  if (customerId !== user.subscription?.stripeCustomerId) {
    await (await users()).updateOne(
      { _id: user._id },
      {
        $set: {
          "subscription.stripeCustomerId": customerId,
          updatedAt: new Date(),
        },
      },
    );
  }
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: e.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${e.APP_URL}/settings?billing=success`,
    cancel_url: `${e.APP_URL}/settings?billing=cancelled`,
    metadata: { kind: "subscription", userId: user._id.toString() },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

export async function openBillingPortal(): Promise<string> {
  const { user } = await requireUser();
  const customerId = user.subscription?.stripeCustomerId;
  if (!customerId) throw new Error("No Stripe customer on file.");
  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env().APP_URL}/settings`,
  });
  return portal.url;
}

export async function startDonation(amountCents: number, currency = "EUR"): Promise<string> {
  const { user } = await requireUser();
  const parsed = donationAmountSchema.parse({ amountCents, currency });
  const e = env();
  if (!e.STRIPE_SECRET_KEY) throw new Error("STRIPE_NOT_CONFIGURED");
  const stripe = getStripe();
  const customerId = await ensureCustomer({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    existingId: user.subscription?.stripeCustomerId,
  });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: parsed.currency.toLowerCase(),
          product_data: { name: "WeSchedule Supporter Donation" },
          unit_amount: parsed.amountCents,
        },
      },
    ],
    submit_type: "donate",
    success_url: `${e.APP_URL}/account?donation=success`,
    cancel_url: `${e.APP_URL}/account?donation=cancelled`,
    metadata: {
      kind: "donation",
      userId: user._id.toString(),
    },
    payment_intent_data: {
      metadata: {
        kind: "donation",
        userId: user._id.toString(),
      },
    },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}
