import { NextResponse } from "next/server";
import { resetSchema } from "@/lib/validation";
import { users, verificationTokens } from "@/lib/collections";
import { hashPassword } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reset data" }, { status: 400 });
  }
  const tokens = await verificationTokens();
  const doc = await tokens.findOne({ token: parsed.data.token, kind: "password_reset" });
  if (!doc || doc.expiresAt < new Date()) {
    if (doc) await tokens.deleteOne({ _id: doc._id });
    return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await (await users()).updateOne(
    { _id: doc.userId },
    { $set: { passwordHash, updatedAt: new Date() } },
  );
  await tokens.deleteOne({ _id: doc._id });

  return NextResponse.json({ ok: true });
}
