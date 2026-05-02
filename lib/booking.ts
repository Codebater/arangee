import { ObjectId } from "mongodb";
import { availability, bookings, eventTypes, integrations } from "./collections";
import { findUserByUsername } from "./scope";
import { computeSlots } from "./availability";
import { ymdInTz } from "./timezone";
import { newManageToken } from "./tokens";
import { createCalendarEvent, deleteCalendarEvent, getBusyTimes } from "./calendar";
import { env } from "./env";
import type { BookingDoc, EventTypeDoc, UserDoc } from "./types";

export class BookingError extends Error {
  constructor(public readonly code: "slot_taken" | "not_found" | "validation" | "calendar", message: string) {
    super(message);
  }
}

interface CreateBookingInput {
  username: string;
  slug: string;
  startUtc: Date;
  guestName: string;
  guestEmail: string;
  guestTimezone: string;
  customAnswers: Record<string, string>;
}

async function loadHostAndEvent(
  username: string,
  slug: string,
): Promise<{ host: UserDoc; eventType: EventTypeDoc }> {
  const host = await findUserByUsername(username);
  if (!host) throw new BookingError("not_found", "Host not found");
  const eventType = await (await eventTypes()).findOne({
    userId: host._id,
    slug,
    active: true,
  });
  if (!eventType) throw new BookingError("not_found", "Event type not found");
  return { host, eventType };
}

export async function createBooking(input: CreateBookingInput): Promise<BookingDoc> {
  const { host, eventType } = await loadHostAndEvent(input.username, input.slug);

  const integration = await (await integrations()).findOne({
    userId: host._id,
    provider: "google_calendar",
    status: "ACTIVE",
  });
  if (!integration) throw new BookingError("calendar", "Calendar not connected");

  const avail = await (await availability()).findOne({ userId: host._id });
  if (!avail) throw new BookingError("not_found", "Availability not configured");

  const startUtc = input.startUtc;
  const endUtc = new Date(startUtc.getTime() + eventType.durationMinutes * 60_000);

  const windowStart = new Date(startUtc.getTime() - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(endUtc.getTime() + 24 * 60 * 60 * 1000);

  const busy = await getBusyTimes(
    integration.composioUserId,
    integration.calendarId,
    windowStart,
    windowEnd,
    avail.timezone,
  );

  const dayKey = ymdInTz(startUtc, avail.timezone);
  const sameDayCount = await (await bookings()).countDocuments({
    userId: host._id,
    eventTypeSlug: eventType.slug,
    status: "confirmed",
    startUtc: {
      $gte: new Date(`${dayKey}T00:00:00Z`),
      $lt: new Date(`${dayKey}T23:59:59Z`),
    },
  });

  const candidates = computeSlots({
    eventType,
    availability: avail,
    busy,
    now: new Date(),
    bookingsPerDay: { [dayKey]: sameDayCount },
  });
  const free = candidates.some((s) => s.startUtc.getTime() === startUtc.getTime());
  if (!free) throw new BookingError("slot_taken", "Slot is no longer available");

  const manageToken = newManageToken();
  const description = buildEventDescription(eventType, input.guestName, input.customAnswers, manageToken);

  const created = await createCalendarEvent(integration.composioUserId, integration.calendarId, {
    summary: `${eventType.title} with ${input.guestName}`,
    description,
    startUtc,
    durationMinutes: eventType.durationMinutes,
    attendees: [{ email: input.guestEmail, displayName: input.guestName }],
    withMeet: eventType.location.type === "google_meet",
  });

  const doc: BookingDoc = {
    _id: new ObjectId(),
    userId: host._id,
    eventTypeSlug: eventType.slug,
    eventTypeId: eventType._id,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestTimezone: input.guestTimezone,
    customAnswers: input.customAnswers,
    startUtc,
    endUtc,
    googleEventId: created.googleEventId,
    meetLink: created.meetLink,
    manageToken,
    status: "confirmed",
    rescheduledToBookingId: null,
    createdAt: new Date(),
    cancelledAt: null,
  };

  try {
    await (await bookings()).insertOne(doc);
  } catch (err) {
    await deleteCalendarEvent(integration.composioUserId, integration.calendarId, created.googleEventId).catch(() => {});
    throw err;
  }

  return doc;
}

export async function cancelBooking(token: string): Promise<BookingDoc> {
  const col = await bookings();
  const booking = await col.findOne({ manageToken: token });
  if (!booking) throw new BookingError("not_found", "Booking not found");
  if (booking.status !== "confirmed") throw new BookingError("not_found", "Booking not active");

  await col.updateOne({ _id: booking._id }, { $set: { status: "cancelled", cancelledAt: new Date() } });

  const integration = await (await integrations()).findOne({
    userId: booking.userId,
    provider: "google_calendar",
    status: "ACTIVE",
  });
  if (integration) {
    await deleteCalendarEvent(integration.composioUserId, integration.calendarId, booking.googleEventId).catch(() => {});
  }

  return { ...booking, status: "cancelled", cancelledAt: new Date() };
}

export async function rescheduleBooking(token: string, newStartUtc: Date): Promise<BookingDoc> {
  const col = await bookings();
  const original = await col.findOne({ manageToken: token });
  if (!original) throw new BookingError("not_found", "Booking not found");
  if (original.status !== "confirmed") throw new BookingError("not_found", "Booking not active");

  const host = await (await import("./collections")).users();
  const hostDoc = await host.findOne({ _id: original.userId });
  if (!hostDoc) throw new BookingError("not_found", "Host not found");

  const newBooking = await createBooking({
    username: hostDoc.username,
    slug: original.eventTypeSlug,
    startUtc: newStartUtc,
    guestName: original.guestName,
    guestEmail: original.guestEmail,
    guestTimezone: original.guestTimezone,
    customAnswers: original.customAnswers,
  });

  await col.updateOne(
    { _id: original._id },
    { $set: { status: "rescheduled", rescheduledToBookingId: newBooking._id, cancelledAt: new Date() } },
  );

  const integration = await (await integrations()).findOne({
    userId: original.userId,
    provider: "google_calendar",
    status: "ACTIVE",
  });
  if (integration) {
    await deleteCalendarEvent(integration.composioUserId, integration.calendarId, original.googleEventId).catch(() => {});
  }

  return newBooking;
}

function buildEventDescription(
  evt: EventTypeDoc,
  guestName: string,
  answers: Record<string, string>,
  manageToken: string,
): string {
  const lines: string[] = [];
  lines.push(`${evt.title} with ${guestName}`);
  lines.push("");
  if (evt.description) {
    lines.push(evt.description);
    lines.push("");
  }

  if (evt.customQuestions.length > 0) {
    for (const q of evt.customQuestions) {
      const value = answers[q.id];
      if (value) {
        lines.push(`${q.label}: ${value}`);
      }
    }
    lines.push("");
  }

  if (evt.location.type === "phone") {
    lines.push(`Phone: ${evt.location.phoneNumber}`);
    lines.push("");
  } else if (evt.location.type === "custom") {
    lines.push(evt.location.customText);
    lines.push("");
  }

  lines.push("--");
  lines.push("Need to make a change?");
  lines.push(`Reschedule or cancel: ${env().APP_URL}/b/${manageToken}`);
  return lines.join("\n");
}
