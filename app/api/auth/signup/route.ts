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

  const usernameOwner = await u.findOne({ username });
  const emailOwner = await u.findOne({ email });

  if (usernameOwner && (!emailOwner || !usernameOwner._id.equals(emailOwner._id))) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }
  if (emailOwner && emailOwner.passwordHash) {
    return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  let userId: ObjectId;

  if (emailOwner) {
    userId = emailOwner._id;
    await u.updateOne(
      { _id: userId },
      {
        $set: {
          username,
          name,
          passwordHash,
          emailVerifiedAt: now,
          plan: emailOwner.plan ?? "free",
          updatedAt: now,
        },
      },
    );
    return NextResponse.json({ ok: true, upgraded: true });
  } else {
    userId = new ObjectId();
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
  }

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
