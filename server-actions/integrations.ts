"use server";

import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { requireUser } from "@/lib/auth-helpers";
import { initiateGoogleConnection } from "@/lib/calendar";
import { integrations } from "@/lib/collections";
import { env } from "@/lib/env";
import { connectIcloud, pickPrimaryCalendar } from "@/lib/apple-sync";
import { encryptString } from "@/lib/crypto";
import { appleConnectSchema } from "@/lib/validation";

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

export async function testApple(input: { email: string; appPassword: string }) {
  await requireUser();
  const parsed = appleConnectSchema.parse(input);
  try {
    const { calendars } = await connectIcloud(parsed.email, parsed.appPassword);
    return { ok: true as const, calendarCount: calendars.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Apple rejected those credentials.";
    throw new Error(`INVALID_APPLE_CREDENTIALS:${msg}`);
  }
}

export async function connectApple(input: { email: string; appPassword: string }) {
  const { user } = await requireUser();
  const parsed = appleConnectSchema.parse(input);
  let calendars;
  try {
    const result = await connectIcloud(parsed.email, parsed.appPassword);
    calendars = result.calendars;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Apple rejected those credentials.";
    throw new Error(`INVALID_APPLE_CREDENTIALS:${msg}`);
  }
  const picked = pickPrimaryCalendar(calendars);
  if (!picked) {
    throw new Error("NO_WRITABLE_CALENDAR");
  }
  const passwordEnc = encryptString(parsed.appPassword.replace(/\s+/g, ""));
  await (await integrations()).updateOne(
    { userId: user._id, provider: "apple_calendar_mirror" },
    {
      $set: {
        status: "ACTIVE" as const,
        appleEmail: parsed.email.trim(),
        appleAppPasswordEnc: passwordEnc,
        calendarId: picked.url,
        calendarSummary: picked.displayName ?? "iCloud",
        lastCheckedAt: new Date(),
      },
      $setOnInsert: {
        _id: new ObjectId(),
        userId: user._id,
        provider: "apple_calendar_mirror" as const,
        connectedAt: new Date(),
      },
    },
    { upsert: true },
  );
}

export async function disconnectApple() {
  const { user } = await requireUser();
  await (await integrations()).deleteOne({
    userId: user._id,
    provider: "apple_calendar_mirror",
  });
}
