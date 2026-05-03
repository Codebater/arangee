import { NextResponse } from "next/server";
import { openBillingPortal } from "@/server-actions/billing";

export const runtime = "nodejs";

export async function GET() {
  try {
    const url = await openBillingPortal();
    return NextResponse.redirect(url, 303);
  } catch (err) {
    const message = err instanceof Error ? err.message : "portal_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
