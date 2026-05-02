import type { Collection } from "mongodb";
import { getDb } from "./db";
import type {
  UserDoc,
  VerificationTokenDoc,
  IntegrationDoc,
  EventTypeDoc,
  AvailabilityDoc,
  BookingDoc,
  PendingBookingDoc,
  ImageDoc,
  WebhookEventDoc,
} from "./types";

export async function users(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}
export async function verificationTokens(): Promise<Collection<VerificationTokenDoc>> {
  return (await getDb()).collection<VerificationTokenDoc>("verificationTokens");
}
export async function integrations(): Promise<Collection<IntegrationDoc>> {
  return (await getDb()).collection<IntegrationDoc>("integrations");
}
export async function eventTypes(): Promise<Collection<EventTypeDoc>> {
  return (await getDb()).collection<EventTypeDoc>("eventTypes");
}
export async function availability(): Promise<Collection<AvailabilityDoc>> {
  return (await getDb()).collection<AvailabilityDoc>("availability");
}
export async function bookings(): Promise<Collection<BookingDoc>> {
  return (await getDb()).collection<BookingDoc>("bookings");
}
export async function pendingBookings(): Promise<Collection<PendingBookingDoc>> {
  return (await getDb()).collection<PendingBookingDoc>("pendingBookings");
}
export async function images(): Promise<Collection<ImageDoc>> {
  return (await getDb()).collection<ImageDoc>("images");
}
export async function webhookEvents(): Promise<Collection<WebhookEventDoc>> {
  return (await getDb()).collection<WebhookEventDoc>("webhookEvents");
}

let indexesEnsured = false;

export async function ensureIndexes() {
  if (indexesEnsured) return;
  const [u, vt, et, bk, pb, im, we, av, ig] = [
    await users(),
    await verificationTokens(),
    await eventTypes(),
    await bookings(),
    await pendingBookings(),
    await images(),
    await webhookEvents(),
    await availability(),
    await integrations(),
  ];

  await u.createIndex({ email: 1 }, { unique: true });
  await u.createIndex({ username: 1 }, { unique: true });

  await vt.createIndex({ token: 1 }, { unique: true });
  await vt.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await et.createIndex({ userId: 1, slug: 1 }, { unique: true });
  await et.createIndex({ userId: 1, active: 1, position: 1 });

  await bk.createIndex({ manageToken: 1 }, { unique: true });
  await bk.createIndex({ userId: 1, startUtc: 1 });
  await bk.createIndex({ userId: 1, status: 1, startUtc: 1 });
  await bk.createIndex({ endUtc: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

  await pb.createIndex({ sessionId: 1 }, { unique: true });
  await pb.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await im.createIndex({ ownerUserId: 1, kind: 1 });

  await we.createIndex({ provider: 1, externalId: 1 }, { unique: true });

  await av.createIndex({ userId: 1 }, { unique: true });

  await ig.createIndex({ userId: 1, provider: 1 }, { unique: true });

  indexesEnsured = true;
}
