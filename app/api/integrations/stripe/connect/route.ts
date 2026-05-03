import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { env, paymentsConfigured } from "@/lib/env";
import { getStripe } from "@/lib/payments/stripe";
import { users } from "@/lib/collections";

export const runtime = "nodejs";

export async function GET() {
  const { user } = await requireUser();
  if (!paymentsConfigured().stripe) {
    return NextResponse.redirect(`${env().APP_URL}/settings?stripe=not_configured`);
  }
  const stripe = getStripe();

  let accountId = user.payments?.stripe?.accountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: user.name,
        url: `${env().APP_URL}/${user.username}`,
      },
    });
    accountId = account.id;
    await (await users()).updateOne(
      { _id: user._id },
      {
        $set: {
          "payments.stripe": {
            accountId,
            chargesEnabled: false,
            detailsSubmitted: false,
            connectedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
    );
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${env().APP_URL}/api/integrations/stripe/connect`,
    return_url: `${env().APP_URL}/api/integrations/stripe/callback`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(link.url);
}
