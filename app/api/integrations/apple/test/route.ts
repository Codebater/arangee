import { NextResponse } from "next/server";
import { testApple } from "@/server-actions/integrations";

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
    const result = await testApple({ email, appPassword });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "test_failed";
    if (msg.startsWith("INVALID_APPLE_CREDENTIALS")) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
