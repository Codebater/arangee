"use server";

import { requireUser } from "@/lib/auth-helpers";
import { users } from "@/lib/collections";
import { changePasswordSchema } from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/users";

export async function changePassword(input: { current: string; next: string }) {
  const { user } = await requireUser();
  const parsed = changePasswordSchema.parse(input);
  const ok = await verifyPassword(parsed.current, user.passwordHash);
  if (!ok) throw new Error("INVALID_CURRENT");
  if (parsed.current === parsed.next) {
    throw new Error("SAME_PASSWORD");
  }
  const newHash = await hashPassword(parsed.next);
  await (await users()).updateOne(
    { _id: user._id },
    { $set: { passwordHash: newHash, updatedAt: new Date() } },
  );
}
