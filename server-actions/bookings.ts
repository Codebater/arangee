"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { bookings, eventTypes } from "@/lib/collections";
import { cancelBooking } from "@/lib/booking";
import { sendCancelByHostToGuest } from "@/lib/email";
import { env } from "@/lib/env";

export async function cancelBookingByAdmin(bookingId: string) {
  const { user } = await requireUser();
  if (!ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking id.");
  }
  const col = await bookings();
  const booking = await col.findOne({ _id: new ObjectId(bookingId), userId: user._id });
  if (!booking) throw new Error("Booking not found.");
  if (booking.status !== "confirmed") {
    throw new Error("Booking is not active.");
  }

  const cancelled = await cancelBooking(booking.manageToken);

  const eventType = await (await eventTypes()).findOne({ _id: cancelled.eventTypeId });
  const eventTitle = eventType?.title ?? cancelled.eventTypeSlug;
  const profileUrl = `${env().APP_URL}/${user.username}`;
  const refund =
    cancelled.payment?.refund && cancelled.payment.refund.amount > 0
      ? {
          amount: cancelled.payment.refund.amount,
          currency: cancelled.payment.currency,
        }
      : null;

  try {
    await sendCancelByHostToGuest({
      to: cancelled.guestEmail,
      guestName: cancelled.guestName,
      hostName: user.name,
      eventTitle,
      startUtc: cancelled.startUtc,
      profileUrl,
      refund,
    });
  } catch (err) {
    console.error("[cancelBookingByAdmin] email send failed", err);
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  return {
    refundAmountCents: refund?.amount ?? 0,
    refundCurrency: refund?.currency ?? null,
  };
}
