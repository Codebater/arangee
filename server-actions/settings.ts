"use server";

import { revalidatePath } from "next/cache";
import { users } from "@/lib/collections";
import { profileFormSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth-helpers";

export async function saveProfile(formData: FormData) {
  const { user } = await requireUser();
  const parsed = profileFormSchema.parse({
    name: String(formData.get("name") ?? ""),
    bio: formData.get("bio") ? String(formData.get("bio")) : null,
    defaultTimezone: String(formData.get("defaultTimezone") ?? "UTC"),
  });
  await (await users()).updateOne(
    { _id: user._id },
    { $set: { ...parsed, updatedAt: new Date() } },
  );
  revalidatePath("/settings");
}
