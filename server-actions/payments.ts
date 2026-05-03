"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { users } from "@/lib/collections";
import { encryptString } from "@/lib/crypto";
import { nowpaymentsKeysSchema } from "@/lib/validation";

export async function saveNowpaymentsKeys(payload: unknown) {
  const { user } = await requireUser();
  const parsed = nowpaymentsKeysSchema.parse(payload);
  await (await users()).updateOne(
    { _id: user._id },
    {
      $set: {
        "payments.nowpayments": {
          apiKeyEnc: encryptString(parsed.apiKey),
          ipnSecretEnc: encryptString(parsed.ipnSecret),
          connectedAt: new Date(),
        },
        updatedAt: new Date(),
      },
    },
  );
  revalidatePath("/settings");
}

export async function removeNowpaymentsKeys() {
  const { user } = await requireUser();
  await (await users()).updateOne(
    { _id: user._id },
    {
      $unset: { "payments.nowpayments": "" },
      $set: { updatedAt: new Date() },
    },
  );
  revalidatePath("/settings");
}
