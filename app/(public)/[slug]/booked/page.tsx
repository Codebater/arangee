export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { Check } from "lucide-react";
import { bookings, eventTypes } from "@/lib/collections";
import { isValidTokenShape } from "@/lib/tokens";

export default async function BookedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const token = sp.token;
  if (!token || !isValidTokenShape(token)) notFound();

  const booking = await (await bookings()).findOne({ manageToken: token, eventTypeSlug: slug });
  if (!booking) notFound();
  const evt = await (await eventTypes()).findOne({ _id: booking.eventTypeId });
  if (!evt) notFound();

  const dt = new Date(booking.startUtc);
  const labelDate = formatInTimeZone(dt, booking.guestTimezone, "EEEE, MMMM d");
  const labelTime = formatInTimeZone(dt, booking.guestTimezone, "h:mm a");

  return (
    <main className="max-w-xl mx-auto px-6 py-20 text-center animate-fade-up">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[--color-primary-tint] text-[--color-primary]">
        <Check size={24} />
      </div>
      <h1 className="font-display text-4xl mt-6">You&apos;re booked.</h1>
      <p className="font-mono mt-3">{labelDate} · {labelTime}</p>
      <p className="text-sm text-[--color-ink-muted] mt-2">An invite has been sent to {booking.guestEmail}.</p>
      {booking.meetLink && (
        <p className="mt-4 text-sm">
          <a href={booking.meetLink} className="text-[--color-primary] underline">Join Google Meet</a>
        </p>
      )}
      <p className="mt-10 text-sm">
        Need to make a change?{" "}
        <a href={`/b/${booking.manageToken}`} className="text-[--color-primary] underline">Manage booking</a>
      </p>
    </main>
  );
}
