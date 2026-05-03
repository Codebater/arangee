import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { env } from "@/lib/env";
import { users } from "@/lib/collections";

export const runtime = "nodejs";

export async function POST() {
  const { user } = await requireUser();
  await (await users()).updateOne(
    { _id: user._id },
    {
      $unset: { "payments.stripe": "" },
      $set: { updatedAt: new Date() },
    },
  );
  return NextResponse.redirect(`${env().APP_URL}/settings?stripe=disconnected`, 303);
}
