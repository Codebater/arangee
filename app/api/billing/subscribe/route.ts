import { NextResponse } from "next/server";
import { startSubscription } from "@/server-actions/billing";

export const runtime = "nodejs";

export async function POST() {
  try {
    const url = await startSubscription();
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "subscribe_failed";
    if (message === "STRIPE_NOT_CONFIGURED") {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
