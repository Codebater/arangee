import { NextResponse } from "next/server";
import { disconnectApple } from "@/server-actions/integrations";

export const runtime = "nodejs";

export async function POST() {
  try {
    await disconnectApple();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "disconnect_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
