export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { eventTypes, integrations, availability, bookings } from "@/lib/collections";
import { computeSlots } from "@/lib/availability";
import { getBusyTimes } from "@/lib/calendar";
import { ymdInTz } from "@/lib/timezone";
import { BookingCalendar } from "@/components/public/BookingCalendar";

export const revalidate = 30;

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reschedule?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const evt = await (await eventTypes()).findOne({ slug, active: true });
  if (!evt) notFound();

  const integ = await (await integrations()).findOne({
    provider: "google_calendar",
    status: "ACTIVE",
  });
  const avail = integ ? await (await availability()).findOne({ userId: integ.userId }) : null;

  let slots: { startUtc: string; endUtc: string }[] = [];
  let unavailable = false;
  if (integ && avail) {
    try {
      const now = new Date();
      const horizon = new Date(now.getTime() + evt.rules.maxAdvanceDays * 24 * 3600_000);
      const busy = await getBusyTimes(
        integ.composioUserId,
        integ.calendarId,
        now,
        horizon,
        avail.timezone,
      );
      const counts: Record<string, number> = {};
      if (evt.rules.maxBookingsPerDay !== null) {
        const list = await (await bookings())
          .find({
            eventTypeSlug: slug,
            status: "confirmed",
            startUtc: { $gte: now, $lt: horizon },
          })
          .toArray();
        for (const b of list) {
          const k = ymdInTz(b.startUtc, avail.timezone);
          counts[k] = (counts[k] ?? 0) + 1;
        }
      }
      slots = computeSlots({
        eventType: evt,
        availability: avail,
        busy,
        now,
        bookingsPerDay: counts,
      }).map((s) => ({ startUtc: s.startUtc.toISOString(), endUtc: s.endUtc.toISOString() }));
    } catch {
      unavailable = true;
    }
  } else {
    unavailable = true;
  }

  const locationLabel =
    evt.location.type === "google_meet"
      ? "Google Meet"
      : evt.location.type === "phone"
        ? "Phone"
        : "In-person";

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 md:py-16 animate-fade-up">
      {sp.reschedule && (
        <div className="mb-6 rounded-md bg-[--primary-tint] px-4 py-2.5 text-[13px] text-[--ink] flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[--primary]" />
          Pick a new time below to reschedule your booking.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-14">
        <aside className="md:col-span-2 space-y-3">
          <div
            className="h-[2px] w-10 rounded-full"
            style={{ background: `var(--event-${evt.color})` }}
          />
          <h1 className="text-3xl">{evt.title}</h1>
          <p className="font-mono text-[12px] text-[--ink-muted]">
            {evt.durationMinutes}m · {locationLabel}
          </p>
          {evt.description && (
            <p className="text-[14px] text-[--ink-soft] mt-3 whitespace-pre-wrap leading-relaxed">
              {evt.description}
            </p>
          )}
        </aside>
        <section className="md:col-span-3">
          {unavailable ? (
            <div className="rounded-lg border border-[--border] bg-[--surface] p-8 text-center">
              <p className="text-sm text-[--ink-muted]">
                Booking is temporarily unavailable. Please try again later.
              </p>
            </div>
          ) : (
            <BookingCalendar slug={slug} slots={slots} ownerTimezone={avail!.timezone} />
          )}
        </section>
      </div>
    </main>
  );
}
