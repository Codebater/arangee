import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";
import { forgotSchema } from "@/lib/validation";
import { users, verificationTokens, ensureIndexes } from "@/lib/collections";
import { sendPasswordReset } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureIndexes();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: true });

  const user = await (await users()).findOne({ email: parsed.data.email.toLowerCase() });
  if (!user) return NextResponse.json({ ok: true });

  const token = randomBytes(32).toString("base64url");
  await (await verificationTokens()).insertOne({
    _id: new ObjectId(),
    userId: user._id,
    token,
    kind: "password_reset",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    createdAt: new Date(),
  });

  try {
    await sendPasswordReset({ to: user.email, name: user.name, token });
  } catch (err) {
    console.error("[forgot] sendPasswordReset failed", err);
  }

  return NextResponse.json({ ok: true });
}
