import { env } from "@/lib/env";
import type {
  PaymentProvider,
  CheckoutInput,
  CheckoutResult,
  RefundInput,
  RefundResult,
} from "./types";
import { ManualRefundRequiredError } from "./types";

const BASE = "https://api.nowpayments.io/v1";

export const nowpaymentsProvider: PaymentProvider = {
  id: "nowpayments",

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!input.hostNowpaymentsApiKey) {
      throw new Error("Host has not connected NowPayments.");
    }
    const res = await fetch(`${BASE}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": input.hostNowpaymentsApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        price_amount: input.amount / 100,
        price_currency: input.currency.toLowerCase(),
        order_id: `${input.hostUserId.toString()}:${input.pendingBookingId.toString()}`,
        order_description: input.description,
        ipn_callback_url: `${env().APP_URL}/api/webhooks/nowpayments`,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`NowPayments invoice create failed: ${res.status} ${text}`);
    }
    const json = (await res.json()) as { invoice_url?: string; id?: string };
    if (!json.invoice_url || !json.id) {
      throw new Error("NowPayments did not return an invoice URL or id.");
    }
    return { checkoutUrl: json.invoice_url, sessionId: String(json.id) };
  },

  async refund(_input: RefundInput): Promise<RefundResult> {
    throw new ManualRefundRequiredError();
  },
};
