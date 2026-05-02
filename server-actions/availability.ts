"use server";

import { revalidatePath } from "next/cache";
import { availability } from "@/lib/collections";
import { availabilityFormSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth-helpers";
import type { AvailabilityDoc } from "@/lib/types";

export async function saveAvailability(formData: FormData) {
  const { user } = await requireUser();
  const parsed = availabilityFormSchema.parse(JSON.parse(String(formData.get("payload"))));
  await (await availability()).updateOne(
    { userId: user._id },
    {
      $set: {
        ...parsed,
        weeklyHours: parsed.weeklyHours as AvailabilityDoc["weeklyHours"],
        userId: user._id,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  revalidatePath("/availability");
}
