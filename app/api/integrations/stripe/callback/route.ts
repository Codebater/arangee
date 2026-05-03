import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/payments/stripe";
import { users } from "@/lib/collections";

export const runtime = "nodejs";

export async function GET() {
  const { user } = await requireUser();
  const accountId = user.payments?.stripe?.accountId;
  if (!accountId) {
    return NextResponse.redirect(`${env().APP_URL}/settings?stripe=missing_account`);
  }
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    await (await users()).updateOne(
      { _id: user._id },
      {
        $set: {
          "payments.stripe.chargesEnabled": Boolean(account.charges_enabled),
          "payments.stripe.detailsSubmitted": Boolean(account.details_submitted),
          updatedAt: new Date(),
        },
      },
    );
    return NextResponse.redirect(
      `${env().APP_URL}/settings?stripe=${account.charges_enabled ? "connected" : "pending"}`,
    );
  } catch (err) {
    console.error("[stripe callback] retrieve failed", err);
    return NextResponse.redirect(`${env().APP_URL}/settings?stripe=error`);
  }
}
