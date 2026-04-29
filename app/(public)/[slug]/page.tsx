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

  const integ = await (await integrations()).findOne({ provider: "google_calendar", status: "ACTIVE" });
  const avail = integ ? await (await availability()).findOne({ userId: integ.userId }) : null;

  let slots: { startUtc: string; endUtc: string }[] = [];
  let unavailable = false;
  if (integ && avail) {
    try {
      const now = new Date();
      const horizon = new Date(now.getTime() + evt.rules.maxAdvanceDays * 24 * 3600_000);
      const busy = await getBusyTimes(integ.composioUserId, integ.calendarId, now, horizon, avail.timezone);
      const counts: Record<string, number> = {};
      if (evt.rules.maxBookingsPerDay !== null) {
        const list = await (await bookings()).find({
          eventTypeSlug: slug,
          status: "confirmed",
          startUtc: { $gte: now, $lt: horizon },
        }).toArray();
        for (const b of list) {
          const k = ymdInTz(b.startUtc, avail.timezone);
          counts[k] = (counts[k] ?? 0) + 1;
        }
      }
      slots = computeSlots({ eventType: evt, availability: avail, busy, now, bookingsPerDay: counts })
        .map((s) => ({ startUtc: s.startUtc.toISOString(), endUtc: s.endUtc.toISOString() }));
    } catch {
      unavailable = true;
    }
  } else {
    unavailable = true;
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 md:py-16 animate-fade-up">
      {sp.reschedule && (
        <div className="mb-6 rounded-md border border-[--color-warning] bg-[--color-primary-tint] px-4 py-2 text-sm">
          Pick a new time below to reschedule your booking.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        <aside className="md:col-span-2 space-y-3">
          <div className="h-1 w-12 rounded-full" style={{ background: `var(--color-event-${evt.color})` }} />
          <h1 className="font-display text-4xl">{evt.title}</h1>
          <p className="font-mono text-xs text-[--color-ink-muted]">
            {evt.durationMinutes} min · {evt.location.type === "google_meet" ? "Google Meet" : evt.location.type === "phone" ? "Phone" : "In-person"}
          </p>
          {evt.description && <p className="text-sm text-[--color-ink-soft] mt-3 whitespace-pre-wrap">{evt.description}</p>}
        </aside>
        <section className="md:col-span-3">
          {unavailable ? (
            <p className="text-sm text-[--color-ink-muted]">Booking is temporarily unavailable. Please try again later.</p>
          ) : (
            <BookingCalendar slug={slug} slots={slots} ownerTimezone={avail!.timezone} />
          )}
        </section>
      </div>
    </main>
  );
}
