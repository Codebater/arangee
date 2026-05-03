import { NextResponse } from "next/server";
import { connectApple } from "@/server-actions/integrations";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: unknown; appPassword?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email : "";
  const appPassword = typeof body.appPassword === "string" ? body.appPassword : "";
  if (!email || !appPassword) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  try {
    await connectApple({ email, appPassword });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "connect_failed";
    if (msg.startsWith("INVALID_APPLE_CREDENTIALS")) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    if (msg === "NO_WRITABLE_CALENDAR") {
      return NextResponse.json({ error: "no_writable_calendar" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
