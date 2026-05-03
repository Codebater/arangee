import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { ObjectId } from "mongodb";
import { users, webhookEvents } from "@/lib/collections";
import { decryptString } from "@/lib/crypto";
import { confirmBookingFromPayment, expirePendingFromPayment } from "@/lib/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NowPaymentsIPN {
  payment_id: string | number;
  payment_status?: string;
  order_id?: string;
  price_amount?: number;
  price_currency?: string;
  pay_amount?: number;
  pay_currency?: string;
}

function sortKeys<T extends Record<string, unknown>>(obj: T): string {
  const sorted: Record<string, unknown> = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      const v = obj[k];
      sorted[k] = v && typeof v === "object" && !Array.isArray(v) ? JSON.parse(sortKeys(v as Record<string, unknown>)) : v;
    });
  return JSON.stringify(sorted);
}

export async function POST(req: Request) {
  const sig = req.headers.get("x-nowpayments-sig");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const rawBody = await req.text();
  let payload: NowPaymentsIPN;
  try {
    payload = JSON.parse(rawBody) as NowPaymentsIPN;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const orderId = payload.order_id ?? "";
  const [hostUserIdRaw] = orderId.split(":");
  if (!hostUserIdRaw || !ObjectId.isValid(hostUserIdRaw)) {
    return NextResponse.json({ error: "bad_order_id" }, { status: 400 });
  }
  const host = await (await users()).findOne({ _id: new ObjectId(hostUserIdRaw) });
  const ipnSecretEnc = host?.payments?.nowpayments?.ipnSecretEnc;
  if (!host || !ipnSecretEnc) {
    return NextResponse.json({ error: "host_not_connected" }, { status: 400 });
  }
  let ipnSecret: string;
  try {
    ipnSecret = decryptString(ipnSecretEnc);
  } catch {
    return NextResponse.json({ error: "secret_decrypt_failed" }, { status: 500 });
  }
  const sorted = sortKeys(payload as unknown as Record<string, unknown>);
  const expected = createHmac("sha512", ipnSecret).update(sorted).digest("hex");
  if (sig.toLowerCase() !== expected.toLowerCase()) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // Idempotency keyed on payment_id.
  const we = await webhookEvents();
  try {
    await we.insertOne({
      _id: new ObjectId(),
      provider: "nowpayments",
      externalId: String(payload.payment_id),
      receivedAt: new Date(),
    });
  } catch {
    return NextResponse.json({ ok: true, dedup: true });
  }

  try {
    const status = payload.payment_status;
    if (status === "finished" || status === "confirmed") {
      await confirmBookingFromPayment("nowpayments", String(payload.payment_id), {
        amount: Math.round((payload.price_amount ?? 0) * 100),
        currency: (payload.price_currency ?? "usd").toUpperCase(),
      });
    } else if (status === "expired" || status === "failed") {
      await expirePendingFromPayment("nowpayments", String(payload.payment_id));
    }
  } catch (err) {
    console.error("[webhooks/nowpayments] handler error", err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
