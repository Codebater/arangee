import { ObjectId } from "mongodb";
import {
  availability,
  bookings,
  eventTypes,
  integrations,
  pendingBookings,
  users,
} from "./collections";
import { findUserByUsername } from "./scope";
import { computeSlots } from "./availability";
import { ymdInTz } from "./timezone";
import { newManageToken } from "./tokens";
import { createCalendarEvent, deleteCalendarEvent, getBusyTimes } from "./calendar";
import { env } from "./env";
import { decryptString } from "./crypto";
import { getProvider, ManualRefundRequiredError } from "./payments";
import type {
  BookingDoc,
  EventTypeDoc,
  PendingBookingDoc,
  UserDoc,
  PaymentProviderId,
  EventPaymentConfig,
} from "./types";

export class BookingError extends Error {
  constructor(
    public readonly code:
      | "slot_taken"
      | "not_found"
      | "validation"
      | "calendar"
      | "payment_not_configured",
    message: string,
  ) {
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

export type CreateBookingIntentResult =
  | { kind: "confirmed"; booking: BookingDoc }
  | { kind: "checkout"; checkoutUrl: string; pendingBookingId: ObjectId; sessionId: string };

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

async function assertSlotAvailable(
  host: UserDoc,
  eventType: EventTypeDoc,
  startUtc: Date,
): Promise<{
  composioUserId: string;
  calendarId: string;
  endUtc: Date;
}> {
  const integration = await (await integrations()).findOne({
    userId: host._id,
    provider: "google_calendar",
    status: "ACTIVE",
  });
  if (!integration) throw new BookingError("calendar", "Calendar not connected");

  const avail = await (await availability()).findOne({ userId: host._id });
  if (!avail) throw new BookingError("not_found", "Availability not configured");

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

  return {
    composioUserId: integration.composioUserId,
    calendarId: integration.calendarId,
    endUtc,
  };
}

interface CommitArgs {
  host: UserDoc;
  eventType: EventTypeDoc;
  payload: Omit<CreateBookingInput, "username" | "slug">;
  composioUserId: string;
  calendarId: string;
  endUtc: Date;
  payment?: BookingDoc["payment"];
}

async function commitBooking(args: CommitArgs): Promise<BookingDoc> {
  const { host, eventType, payload, composioUserId, calendarId, endUtc, payment } = args;

  const manageToken = newManageToken();
  const description = buildEventDescription(
    eventType,
    payload.guestName,
    payload.customAnswers,
    manageToken,
  );

  const created = await createCalendarEvent(composioUserId, calendarId, {
    summary: `${eventType.title} with ${payload.guestName}`,
    description,
    startUtc: payload.startUtc,
    durationMinutes: eventType.durationMinutes,
    attendees: [{ email: payload.guestEmail, displayName: payload.guestName }],
    withMeet: eventType.location.type === "google_meet",
  });

  const doc: BookingDoc = {
    _id: new ObjectId(),
    userId: host._id,
    eventTypeSlug: eventType.slug,
    eventTypeId: eventType._id,
    guestName: payload.guestName,
    guestEmail: payload.guestEmail,
    guestTimezone: payload.guestTimezone,
    customAnswers: payload.customAnswers,
    startUtc: payload.startUtc,
    endUtc,
    googleEventId: created.googleEventId,
    meetLink: created.meetLink,
    manageToken,
    status: "confirmed",
    payment,
    rescheduledToBookingId: null,
    createdAt: new Date(),
    cancelledAt: null,
  };

  try {
    await (await bookings()).insertOne(doc);
  } catch (err) {
    await deleteCalendarEvent(composioUserId, calendarId, created.googleEventId).catch(() => {});
    throw err;
  }

  return doc;
}

export async function createBooking(input: CreateBookingInput): Promise<BookingDoc> {
  const result = await createBookingIntent(input);
  if (result.kind !== "confirmed") {
    throw new BookingError(
      "payment_not_configured",
      "Booking requires payment; use createBookingIntent.",
    );
  }
  return result.booking;
}

export async function createBookingIntent(
  input: CreateBookingInput,
): Promise<CreateBookingIntentResult> {
  const { host, eventType } = await loadHostAndEvent(input.username, input.slug);
  const { composioUserId, calendarId, endUtc } = await assertSlotAvailable(
    host,
    eventType,
    input.startUtc,
  );

  if (!eventType.payment?.enabled) {
    const booking = await commitBooking({
      host,
      eventType,
      payload: {
        startUtc: input.startUtc,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestTimezone: input.guestTimezone,
        customAnswers: input.customAnswers,
      },
      composioUserId,
      calendarId,
      endUtc,
    });
    return { kind: "confirmed", booking };
  }

  const cfg = eventType.payment;
  const provider = getProvider(cfg.provider);
  const pendingBookingId = new ObjectId();

  const stripeAccountId =
    cfg.provider === "stripe" && host.payments?.stripe?.chargesEnabled
      ? host.payments.stripe.accountId
      : undefined;
  const nowpaymentsApiKey =
    cfg.provider === "nowpayments" && host.payments?.nowpayments?.apiKeyEnc
      ? decryptString(host.payments.nowpayments.apiKeyEnc)
      : undefined;

  if (cfg.provider === "stripe" && !stripeAccountId) {
    throw new BookingError("payment_not_configured", "Host has not connected Stripe.");
  }
  if (cfg.provider === "nowpayments" && !nowpaymentsApiKey) {
    throw new BookingError("payment_not_configured", "Host has not connected NowPayments.");
  }

  const successUrl = `${env().APP_URL}/${host.username}/${eventType.slug}/booked?pending=${pendingBookingId.toString()}`;
  const cancelUrl = `${env().APP_URL}/${host.username}/${eventType.slug}`;

  const checkout = await provider.createCheckout({
    hostUserId: host._id,
    hostName: host.name,
    pendingBookingId,
    amount: cfg.amount,
    currency: cfg.currency,
    description: cfg.description ?? `${eventType.title} with ${host.name}`,
    successUrl,
    cancelUrl,
    guestEmail: input.guestEmail,
    hostStripeAccountId: stripeAccountId,
    hostNowpaymentsApiKey: nowpaymentsApiKey,
  });

  const pending: PendingBookingDoc = {
    _id: pendingBookingId,
    userId: host._id,
    eventTypeId: eventType._id,
    eventTypeSlug: eventType.slug,
    payload: {
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestTimezone: input.guestTimezone,
      customAnswers: input.customAnswers,
      startUtc: input.startUtc,
    },
    provider: cfg.provider,
    sessionId: checkout.sessionId,
    amount: cfg.amount,
    currency: cfg.currency,
    status: "awaiting",
    bookingId: null,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    createdAt: new Date(),
  };
  await (await pendingBookings()).insertOne(pending);

  return {
    kind: "checkout",
    checkoutUrl: checkout.checkoutUrl,
    pendingBookingId,
    sessionId: checkout.sessionId,
  };
}

export async function confirmBookingFromPayment(
  provider: PaymentProviderId,
  sessionId: string,
  paid: { amount: number; currency: string },
): Promise<BookingDoc | null> {
  const pendCol = await pendingBookings();
  const pending = await pendCol.findOne({ provider, sessionId });
  if (!pending) {
    console.warn(`[booking] confirm: pending not found for ${provider}/${sessionId}`);
    return null;
  }
  if (pending.status === "completed" && pending.bookingId) {
    return (await bookings()).findOne({ _id: pending.bookingId });
  }
  if (pending.status !== "awaiting") return null;

  const host = await (await users()).findOne({ _id: pending.userId });
  const eventType = await (await eventTypes()).findOne({ _id: pending.eventTypeId });
  if (!host || !eventType) {
    await pendCol.updateOne({ _id: pending._id }, { $set: { status: "expired" } });
    return null;
  }

  let calendarCtx: { composioUserId: string; calendarId: string; endUtc: Date };
  try {
    calendarCtx = await assertSlotAvailable(host, eventType, pending.payload.startUtc);
  } catch (err) {
    await pendCol.updateOne({ _id: pending._id }, { $set: { status: "expired" } });
    if (err instanceof BookingError && err.code === "slot_taken") {
      // Best-effort refund; ignore errors.
      try {
        await refundForProvider(host, eventType.payment, sessionId, pending.amount);
      } catch (refundErr) {
        console.error("[booking] confirm: lost-race refund failed", refundErr);
      }
    }
    throw err;
  }

  const booking = await commitBooking({
    host,
    eventType,
    payload: pending.payload,
    composioUserId: calendarCtx.composioUserId,
    calendarId: calendarCtx.calendarId,
    endUtc: calendarCtx.endUtc,
    payment: {
      provider,
      sessionId,
      amount: paid.amount,
      currency: paid.currency,
      paidAt: new Date(),
    },
  });

  await pendCol.updateOne(
    { _id: pending._id },
    { $set: { status: "completed", bookingId: booking._id } },
  );

  return booking;
}

export async function expirePendingFromPayment(
  provider: PaymentProviderId,
  sessionId: string,
): Promise<void> {
  await (await pendingBookings()).updateOne(
    { provider, sessionId, status: "awaiting" },
    { $set: { status: "expired" } },
  );
}

export async function getPendingBookingStatus(pendingBookingId: string) {
  if (!ObjectId.isValid(pendingBookingId)) return null;
  const doc = await (await pendingBookings()).findOne({
    _id: new ObjectId(pendingBookingId),
  });
  if (!doc) return null;
  if (doc.status === "completed" && doc.bookingId) {
    const booking = await (await bookings()).findOne({ _id: doc.bookingId });
    return {
      status: "completed" as const,
      manageToken: booking?.manageToken ?? null,
    };
  }
  return { status: doc.status, manageToken: null as string | null };
}

async function refundForProvider(
  host: UserDoc,
  payment: EventPaymentConfig | undefined,
  sessionId: string,
  amount?: number,
): Promise<{ refundId: string; amount: number } | null> {
  if (!payment) return null;
  const provider = getProvider(payment.provider);
  try {
    return await provider.refund({
      sessionId,
      amount,
      hostStripeAccountId: host.payments?.stripe?.accountId,
      hostNowpaymentsApiKey: host.payments?.nowpayments?.apiKeyEnc
        ? decryptString(host.payments.nowpayments.apiKeyEnc)
        : undefined,
    });
  } catch (err) {
    if (err instanceof ManualRefundRequiredError) return null;
    throw err;
  }
}

function computeRefundAmount(
  cfg: EventPaymentConfig,
  paidAmount: number,
  startUtc: Date,
): number {
  const hoursUntil = (startUtc.getTime() - Date.now()) / 3_600_000;
  if (typeof cfg.refund.cutoffHours === "number" && hoursUntil < cfg.refund.cutoffHours) {
    return 0;
  }
  if (cfg.refund.policy === "none") return 0;
  if (cfg.refund.policy === "full") return paidAmount;
  if (cfg.refund.policy === "partial") {
    const pct = Math.max(0, Math.min(100, cfg.refund.partialPercent ?? 0));
    return Math.round((paidAmount * pct) / 100);
  }
  return 0;
}

export async function cancelBooking(token: string): Promise<BookingDoc> {
  const col = await bookings();
  const booking = await col.findOne({ manageToken: token });
  if (!booking) throw new BookingError("not_found", "Booking not found");
  if (booking.status !== "confirmed") throw new BookingError("not_found", "Booking not active");

  await col.updateOne(
    { _id: booking._id },
    { $set: { status: "cancelled", cancelledAt: new Date() } },
  );

  const integration = await (await integrations()).findOne({
    userId: booking.userId,
    provider: "google_calendar",
    status: "ACTIVE",
  });
  if (integration) {
    await deleteCalendarEvent(
      integration.composioUserId,
      integration.calendarId,
      booking.googleEventId,
    ).catch(() => {});
  }

  if (booking.payment) {
    const host = await (await users()).findOne({ _id: booking.userId });
    const eventType = await (await eventTypes()).findOne({ _id: booking.eventTypeId });
    if (host && eventType?.payment) {
      const refundAmount = computeRefundAmount(
        eventType.payment,
        booking.payment.amount,
        booking.startUtc,
      );
      if (refundAmount > 0) {
        try {
          const refund = await refundForProvider(
            host,
            eventType.payment,
            booking.payment.sessionId,
            refundAmount,
          );
          if (refund) {
            await col.updateOne(
              { _id: booking._id },
              {
                $set: {
                  "payment.refund": {
                    id: refund.refundId,
                    amount: refund.amount,
                    refundedAt: new Date(),
                  },
                },
              },
            );
          }
        } catch (err) {
          console.error("[booking] cancel refund failed", err);
        }
      }
    }
  }

  return { ...booking, status: "cancelled", cancelledAt: new Date() };
}

export async function rescheduleBooking(token: string, newStartUtc: Date): Promise<BookingDoc> {
  const col = await bookings();
  const original = await col.findOne({ manageToken: token });
  if (!original) throw new BookingError("not_found", "Booking not found");
  if (original.status !== "confirmed") throw new BookingError("not_found", "Booking not active");

  const hostDoc = await (await users()).findOne({ _id: original.userId });
  if (!hostDoc) throw new BookingError("not_found", "Host not found");
  const eventType = await (await eventTypes()).findOne({ _id: original.eventTypeId });
  if (!eventType) throw new BookingError("not_found", "Event type not found");

  // Reschedule keeps the original payment; re-runs availability + creates a
  // fresh calendar event + booking row at the new time.
  const ctx = await assertSlotAvailable(hostDoc, eventType, newStartUtc);

  const newBooking = await commitBooking({
    host: hostDoc,
    eventType,
    payload: {
      startUtc: newStartUtc,
      guestName: original.guestName,
      guestEmail: original.guestEmail,
      guestTimezone: original.guestTimezone,
      customAnswers: original.customAnswers,
    },
    composioUserId: ctx.composioUserId,
    calendarId: ctx.calendarId,
    endUtc: ctx.endUtc,
    payment: original.payment,
  });

  await col.updateOne(
    { _id: original._id },
    {
      $set: {
        status: "rescheduled",
        rescheduledToBookingId: newBooking._id,
        cancelledAt: new Date(),
      },
    },
  );

  const integration = await (await integrations()).findOne({
    userId: original.userId,
    provider: "google_calendar",
    status: "ACTIVE",
  });
  if (integration) {
    await deleteCalendarEvent(
      integration.composioUserId,
      integration.calendarId,
      original.googleEventId,
    ).catch(() => {});
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
