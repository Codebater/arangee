import type { ObjectId } from "mongodb";

export type PaymentProviderId = "stripe" | "nowpayments";

export interface CheckoutInput {
  hostUserId: ObjectId;
  hostName: string;
  pendingBookingId: ObjectId;
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  guestEmail: string;
  hostStripeAccountId?: string;
  hostNowpaymentsApiKey?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

export interface RefundInput {
  sessionId: string;
  amount?: number;
  hostStripeAccountId?: string;
  hostNowpaymentsApiKey?: string;
}

export interface RefundResult {
  refundId: string;
  amount: number;
}

export class ManualRefundRequiredError extends Error {
  constructor() {
    super("Refund must be processed manually for this provider.");
    this.name = "ManualRefundRequiredError";
  }
}

export interface PaymentProvider {
  id: PaymentProviderId;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  refund(input: RefundInput): Promise<RefundResult>;
}
