export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { availability, integrations, bookings, eventTypes } from "@/lib/collections";
import { resolveUserAndEventType } from "@/lib/scope";
import { isReservedUsername } from "@/lib/users";
import {
  computeSlots,
  computeOccupiedIntervals,
  type OccupiedInterval,
} from "@/lib/availability";
import { getBusyTimes } from "@/lib/calendar";
import type { EventColor } from "@/lib/types";
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
  let occupied: OccupiedInterval[] = [];
  let unavailable = false;
  if (integ && avail) {
    try {
      const now = new Date();
      const horizon = new Date(now.getTime() + evt.rules.maxAdvanceDays * 24 * 3600_000);
      const busy = await getBusyTimes(
        integ.composioUserId!,
        integ.calendarId,
        now,
        horizon,
        avail.timezone,
      );

      const allHostBookings = await (await bookings())
        .find({
          userId: host._id,
          status: "confirmed",
          startUtc: { $gte: now, $lt: horizon },
        })
        .toArray();

      const counts: Record<string, number> = {};
      if (evt.rules.maxBookingsPerDay !== null) {
        for (const b of allHostBookings) {
          if (b.eventTypeSlug !== slug) continue;
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

      if (!host.branding?.hideBookedSlots) {
        const eventTypeIds = Array.from(
          new Set(allHostBookings.map((b) => b.eventTypeId.toString())),
        );
        const colorMap: Record<string, EventColor> = {};
        if (eventTypeIds.length) {
          const evts = await (await eventTypes())
            .find({ userId: host._id })
            .project<{ _id: { toString(): string }; color: EventColor }>({ _id: 1, color: 1 })
            .toArray();
          for (const e of evts) colorMap[e._id.toString()] = e.color;
        }
        occupied = computeOccupiedIntervals({
          bookings: allHostBookings.map((b) => ({
            startUtc: b.startUtc,
            endUtc: b.endUtc,
            eventTypeId: b.eventTypeId,
            payment: b.payment,
          })),
          eventTypeColors: colorMap,
          googleBusy: busy,
        });
      }
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

      {(host.branding?.avatarImageId ||
        host.branding?.bannerImageId ||
        host.branding?.profileCard ||
        host.bio ||
        (host.badges?.length ?? 0) > 0 ||
        (host.links?.length ?? 0) > 0 ||
        (host.tierBadges?.length ?? 0) > 0) && (
        <ProfileHeader
          name={host.name}
          username={host.username}
          bio={host.bio}
          avatarImageId={host.branding?.avatarImageId?.toString() ?? null}
          bannerImageId={host.branding?.bannerImageId?.toString() ?? null}
          profileCardTemplate={host.branding?.profileCard?.template ?? null}
          badges={host.badges ?? []}
          links={host.links ?? []}
          tierBadges={host.tierBadges ?? []}
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
        occupied={occupied}
        unavailable={unavailable}
      />
    </main>
  );
}
