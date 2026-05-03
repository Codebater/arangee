import { stripeProvider } from "./stripe";
import { nowpaymentsProvider } from "./nowpayments";
import type { PaymentProvider, PaymentProviderId } from "./types";

export const PAYMENT_PROVIDERS: Record<PaymentProviderId, PaymentProvider> = {
  stripe: stripeProvider,
  nowpayments: nowpaymentsProvider,
};

export function getProvider(id: PaymentProviderId): PaymentProvider {
  return PAYMENT_PROVIDERS[id];
}

export type { PaymentProvider, PaymentProviderId } from "./types";
export { ManualRefundRequiredError } from "./types";
