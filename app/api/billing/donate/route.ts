import { NextResponse } from "next/server";
import { startDonation } from "@/server-actions/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { amountCents?: unknown; currency?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const amountCents = Number(body.amountCents);
  const currency = typeof body.currency === "string" ? body.currency : "EUR";
  if (!Number.isFinite(amountCents) || amountCents < 100) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400 });
  }
  try {
    const url = await startDonation(amountCents, currency);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "donate_failed";
    if (message === "STRIPE_NOT_CONFIGURED") {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
