import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";
import { signupSchema } from "@/lib/validation";
import { users, verificationTokens, ensureIndexes } from "@/lib/collections";
import { hashPassword } from "@/lib/users";
import { sendVerifyEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureIndexes();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid signup data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { email, username, password, name } = parsed.data;
  const u = await users();

  const conflict = await u.findOne({ $or: [{ email }, { username }] });
  if (conflict) {
    const which = conflict.email === email ? "email" : "username";
    return NextResponse.json(
      { error: `That ${which} is already taken.` },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const userId = new ObjectId();
  const now = new Date();
  await u.insertOne({
    _id: userId,
    email,
    username,
    name,
    bio: null,
    defaultTimezone: "UTC",
    passwordHash,
    emailVerifiedAt: null,
    plan: "free",
    createdAt: now,
    updatedAt: now,
  });

  const token = randomBytes(32).toString("base64url");
  await (await verificationTokens()).insertOne({
    _id: new ObjectId(),
    userId,
    token,
    kind: "email_verify",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: now,
  });

  try {
    await sendVerifyEmail({ to: email, name, token });
  } catch (err) {
    console.error("[signup] sendVerifyEmail failed", err);
    return NextResponse.json(
      { error: "Account created, but we couldn't send the verification email. Try /forgot to receive a new link." },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true });
}
