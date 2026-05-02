export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { availability, integrations, bookings } from "@/lib/collections";
import { resolveUserAndEventType } from "@/lib/scope";
import { isReservedUsername } from "@/lib/users";
import { computeSlots } from "@/lib/availability";
import { getBusyTimes } from "@/lib/calendar";
import { ymdInTz } from "@/lib/timezone";
import { BookingShell } from "@/components/public/BookingShell";
import { ProfileHeader } from "@/components/public/ProfileHeader";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const revalidate = 30;

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ reschedule?: string }>;
}) {
  const { username, slug } = await params;
  const sp = await searchParams;
  if (isReservedUsername(username)) notFound();
  const resolved = await resolveUserAndEventType(username, slug);
  if (!resolved) notFound();
  const { user: host, eventType: evt } = resolved;

  const integ = await (await integrations()).findOne({
    userId: host._id,
    provider: "google_calendar",
    status: "ACTIVE",
  });
  const avail = integ ? await (await availability()).findOne({ userId: host._id }) : null;

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
            userId: host._id,
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
    <main className="relative mx-auto max-w-5xl px-6 pb-16 pt-6 md:pt-10 animate-fade-in">
      <div className="mb-10 flex items-center justify-end">
        <ThemeToggle />
      </div>

      {sp.reschedule && (
        <div className="mb-8 flex items-center gap-2.5 rounded-lg border border-border bg-primary-tint px-3.5 py-2.5 text-[13px] text-ink">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Pick a new time below to reschedule your booking.
        </div>
      )}

      {(host.branding?.avatarImageId || host.branding?.bannerImageId || host.bio) && (
        <ProfileHeader
          name={host.name}
          username={host.username}
          bio={host.bio}
          avatarImageId={host.branding?.avatarImageId?.toString() ?? null}
          bannerImageId={host.branding?.bannerImageId?.toString() ?? null}
        />
      )}

      <BookingShell
        username={host.username}
        slug={slug}
        title={evt.title}
        description={evt.description}
        durationMinutes={evt.durationMinutes}
        color={evt.color}
        locationLabel={locationLabel}
        slots={slots}
        unavailable={unavailable}
      />
    </main>
  );
}
