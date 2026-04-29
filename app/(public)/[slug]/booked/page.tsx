export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { Check, Video } from "lucide-react";
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
    <main className="max-w-md mx-auto px-6 py-20 text-center animate-fade-up">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[--primary] text-[--primary-foreground]">
        <Check size={22} strokeWidth={2.5} />
      </div>
      <h1 className="text-3xl mt-6">You&apos;re booked.</h1>
      <p className="font-mono text-[13px] text-[--ink-soft] mt-3">
        {labelDate} · {labelTime}
      </p>
      <p className="text-[13px] text-[--ink-muted] mt-2">
        An invite was sent to {booking.guestEmail}.
      </p>
      {booking.meetLink && (
        <a
          href={booking.meetLink}
          className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-[--border] bg-[--surface] px-3 h-9 text-[13px] text-[--ink] hover:border-[--border-strong] transition-colors duration-150"
        >
          <Video size={14} className="text-[--primary]" /> Join Google Meet
        </a>
      )}
      <div className="mt-10 pt-6 border-t border-[--border]">
        <p className="text-[12px] text-[--ink-muted]">
          Need to make a change?{" "}
          <a
            href={`/b/${booking.manageToken}`}
            className="text-[--primary] hover:underline underline-offset-4"
          >
            Manage booking
          </a>
        </p>
      </div>
    </main>
  );
}
