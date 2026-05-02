"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eventTypes } from "@/lib/collections";
import { eventTypeFormSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth-helpers";

export async function createEventType(formData: FormData) {
  const { user } = await requireUser();
  const parsed = eventTypeFormSchema.parse(JSON.parse(String(formData.get("payload"))));
  const col = await eventTypes();
  const last = await col.find({ userId: user._id }).sort({ position: -1 }).limit(1).toArray();
  const position = (last[0]?.position ?? 0) + 1;
  await col.insertOne({
    _id: new ObjectId(),
    userId: user._id,
    ...parsed,
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
  await (await eventTypes()).updateOne(
    { _id: new ObjectId(id), userId: user._id },
    { $set: { ...parsed, updatedAt: new Date() } },
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
