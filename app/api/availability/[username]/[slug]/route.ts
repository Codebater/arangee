import { NextResponse } from "next/server";
import { availability, integrations, bookings } from "@/lib/collections";
import { resolveUserAndEventType } from "@/lib/scope";
import { isReservedUsername } from "@/lib/users";
import { computeSlots } from "@/lib/availability";
import { ymdInTz } from "@/lib/timezone";
import { getBusyTimes } from "@/lib/calendar";

export const revalidate = 30;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string; slug: string }> },
) {
  const { username, slug } = await params;
  if (isReservedUsername(username)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const resolved = await resolveUserAndEventType(username, slug);
  if (!resolved) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { user: host, eventType: evt } = resolved;

  const integ = await (await integrations()).findOne({
    userId: host._id,
    provider: "google_calendar",
    status: "ACTIVE",
  });
  if (!integ) return NextResponse.json({ error: "calendar_not_connected" }, { status: 503 });

  const avail = await (await availability()).findOne({ userId: host._id });
  if (!avail) return NextResponse.json({ error: "no_availability" }, { status: 503 });

  const now = new Date();
  const horizon = new Date(now.getTime() + evt.rules.maxAdvanceDays * 24 * 3600_000);

  let busy: Array<{ start: Date; end: Date }>;
  try {
    busy = await getBusyTimes(integ.composioUserId!, integ.calendarId, now, horizon, avail.timezone);
  } catch {
    return NextResponse.json({ error: "calendar_unavailable" }, { status: 503 });
  }

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

  const slots = computeSlots({ eventType: evt, availability: avail, busy, now, bookingsPerDay: counts });
  return NextResponse.json({
    timezone: avail.timezone,
    slots: slots.map((s) => ({ startUtc: s.startUtc.toISOString(), endUtc: s.endUtc.toISOString() })),
  });
}
