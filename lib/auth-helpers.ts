import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { users } from "@/lib/collections";
import type { UserDoc } from "@/lib/types";

export async function requireUser(): Promise<{ user: UserDoc }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await (await users()).findOne({ _id: new ObjectId(session.user.id) });
  if (!user) redirect("/login");
  return { user };
}

export async function getOptionalSession() {
  return auth();
}
