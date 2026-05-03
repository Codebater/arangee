import Stripe from "stripe";
import { env } from "@/lib/env";
import type {
  PaymentProvider,
  CheckoutInput,
  CheckoutResult,
  RefundInput,
  RefundResult,
} from "./types";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  _stripe = new Stripe(key);
  return _stripe;
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!input.hostStripeAccountId) {
      throw new Error("Host has not connected Stripe.");
    }
    const stripe = getStripe();
    const feeBps = env().PLATFORM_FEE_BPS;
    const applicationFeeAmount =
      feeBps > 0 ? Math.max(0, Math.floor((input.amount * feeBps) / 10_000)) : undefined;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency.toLowerCase(),
              product_data: { name: input.description },
              unit_amount: input.amount,
            },
          },
        ],
        customer_email: input.guestEmail,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        client_reference_id: input.pendingBookingId.toString(),
        metadata: {
          pendingBookingId: input.pendingBookingId.toString(),
          hostUserId: input.hostUserId.toString(),
        },
        payment_intent_data: applicationFeeAmount
          ? { application_fee_amount: applicationFeeAmount }
          : undefined,
      },
      { stripeAccount: input.hostStripeAccountId },
    );

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { checkoutUrl: session.url, sessionId: session.id };
  },

  async refund(input: RefundInput): Promise<RefundResult> {
    if (!input.hostStripeAccountId) {
      throw new Error("Host Stripe account missing for refund.");
    }
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(
      input.sessionId,
      {},
      { stripeAccount: input.hostStripeAccountId },
    );
    const pi = session.payment_intent;
    const piId = typeof pi === "string" ? pi : pi?.id;
    if (!piId) throw new Error("No payment intent on session.");
    const refund = await stripe.refunds.create(
      { payment_intent: piId, amount: input.amount },
      { stripeAccount: input.hostStripeAccountId },
    );
    return { refundId: refund.id, amount: refund.amount ?? input.amount ?? 0 };
  },
};
