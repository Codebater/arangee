"use server";

import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth-helpers";
import { initiateGoogleConnection } from "@/lib/calendar";
import { integrations } from "@/lib/collections";
import { env } from "@/lib/env";

export async function startGoogleConnect() {
  const { user } = await requireUser();
  const userId = user._id.toString();
  const callbackUrl = `${env().APP_URL}/api/integrations/google/callback`;
  const { redirectUrl, connectionId } = await initiateGoogleConnection(userId, callbackUrl);

  await (await integrations()).updateOne(
    { userId: user._id, provider: "google_calendar" },
    {
      $setOnInsert: {
        _id: new ObjectId(),
        userId: user._id,
        provider: "google_calendar",
        composioUserId: userId,
        connectedAt: new Date(),
        calendarSummary: "",
      },
      $set: {
        composioConnectionId: connectionId,
        status: "INITIATED" as const,
        calendarId: "primary",
        lastCheckedAt: new Date(),
      },
    },
    { upsert: true },
  );

  redirect(redirectUrl);
}

export async function setActiveCalendar(calendarId: string, calendarSummary: string) {
  const { user } = await requireUser();
  await (await integrations()).updateOne(
    { userId: user._id, provider: "google_calendar" },
    { $set: { calendarId, calendarSummary, lastCheckedAt: new Date() } },
  );
}

export async function disconnectGoogle() {
  const { user } = await requireUser();
  await (await integrations()).deleteOne({
    userId: user._id,
    provider: "google_calendar",
  });
}
