"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eventTypes } from "@/lib/collections";
import { eventTypeFormSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth-helpers";
import { generateEventSlug } from "@/lib/slug";
import { canUsePayments, eventTypeLimitFor } from "@/lib/tiers";
import type { UserDoc } from "@/lib/types";

async function uniqueSlug(userId: UserDoc["_id"]): Promise<string> {
  const col = await eventTypes();
  for (let i = 0; i < 6; i++) {
    const candidate = generateEventSlug();
    const taken = await col.findOne({ userId, slug: candidate }, { projection: { _id: 1 } });
    if (!taken) return candidate;
  }
  return generateEventSlug(10);
}

export async function createEventType(formData: FormData) {
  const { user } = await requireUser();
  const parsed = eventTypeFormSchema.parse(JSON.parse(String(formData.get("payload"))));
  const col = await eventTypes();

  const existingCount = await col.countDocuments({ userId: user._id });
  const limit = eventTypeLimitFor(user);
  if (existingCount >= limit) {
    throw new Error(
      `Free plan supports up to ${limit} event types. Upgrade to Pro for unlimited.`,
    );
  }

  const sanitized = { ...parsed };
  if (sanitized.payment?.enabled && !canUsePayments(user)) {
    delete sanitized.payment;
  }

  const last = await col.find({ userId: user._id }).sort({ position: -1 }).limit(1).toArray();
  const position = (last[0]?.position ?? 0) + 1;
  const slug = await uniqueSlug(user._id);
  await col.insertOne({
    _id: new ObjectId(),
    userId: user._id,
    slug,
    ...sanitized,
    position,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  revalidatePath("/event-types");
  redirect("/event-types");
}

export async function updateEventType(id: string, formData: FormData) {
  const { user } = await requireUser();
  const parsed = eventTypeFormSchema.parse(JSON.parse(String(formData.get("payload"))));
  const sanitized = { ...parsed };
  if (sanitized.payment?.enabled && !canUsePayments(user)) {
    delete sanitized.payment;
  }
  await (await eventTypes()).updateOne(
    { _id: new ObjectId(id), userId: user._id },
    { $set: { ...sanitized, updatedAt: new Date() } },
  );
  revalidatePath("/event-types");
  redirect("/event-types");
}

export async function deleteEventType(id: string) {
  const { user } = await requireUser();
  await (await eventTypes()).deleteOne({ _id: new ObjectId(id), userId: user._id });
  revalidatePath("/event-types");
}

export async function toggleActive(id: string, active: boolean) {
  const { user } = await requireUser();
  await (await eventTypes()).updateOne(
    { _id: new ObjectId(id), userId: user._id },
    { $set: { active, updatedAt: new Date() } },
  );
  revalidatePath("/event-types");
}

export async function reorderEventType(id: string, newPosition: number) {
  const { user } = await requireUser();
  await (await eventTypes()).updateOne(
    { _id: new ObjectId(id), userId: user._id },
    { $set: { position: newPosition, updatedAt: new Date() } },
  );
  revalidatePath("/event-types");
}
