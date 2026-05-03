import { addDays } from "date-fns";
import type { AvailabilityDoc, EventColor, EventTypeDoc } from "./types";
import { dayOfWeekInTz, eachDayBetween, zonedDateAt } from "./timezone";

export interface Slot {
  startUtc: Date;
  endUtc: Date;
}

export interface ComputeSlotsInput {
  eventType: EventTypeDoc;
  availability: AvailabilityDoc;
  busy: Array<{ start: Date; end: Date }>;
  now: Date;
  bookingsPerDay: Record<string, number>;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function computeSlots(input: ComputeSlotsInput): Slot[] {
  const { eventType, availability, busy, now, bookingsPerDay } = input;
  const tz = availability.timezone;

  const earliestUtc = new Date(now.getTime() + eventType.rules.minNoticeMinutes * 60_000);
  const latestUtc = addDays(now, eventType.rules.maxAdvanceDays);

  const days = eachDayBetween(earliestUtc, latestUtc, tz);
  const slots: Slot[] = [];

  for (const ymd of days) {
    const override = availability.dateOverrides.find((o) => o.date === ymd);
    let intervals: Array<{ start: string; end: string }>;
    if (override) {
      intervals = override.intervals;
    } else {
      const sample = zonedDateAt(ymd, "12:00", tz);
      const dow = dayOfWeekInTz(sample, tz);
      intervals = availability.weeklyHours.find((w) => w.dayOfWeek === dow)?.intervals ?? [];
    }

    if (intervals.length === 0) continue;
    if (eventType.rules.maxBookingsPerDay !== null && (bookingsPerDay[ymd] ?? 0) >= eventType.rules.maxBookingsPerDay) {
      continue;
    }

    const cap = eventType.rules.maxBookingsPerDay !== null
      ? eventType.rules.maxBookingsPerDay - (bookingsPerDay[ymd] ?? 0)
      : Number.POSITIVE_INFINITY;

    let emittedToday = 0;

    for (const interval of intervals) {
      const intervalStart = zonedDateAt(ymd, interval.start, tz);
      const intervalEnd = zonedDateAt(ymd, interval.end, tz);

      let cursor = intervalStart;
      while (true) {
        const slotEnd = new Date(cursor.getTime() + eventType.durationMinutes * 60_000);
        if (slotEnd > intervalEnd) break;
        if (cursor < earliestUtc) {
          cursor = new Date(cursor.getTime() + eventType.durationMinutes * 60_000);
          continue;
        }

        const checkStart = new Date(cursor.getTime() - eventType.rules.bufferBeforeMin * 60_000);
        const checkEnd = new Date(slotEnd.getTime() + eventType.rules.bufferAfterMin * 60_000);
        const conflict = busy.some((b) => overlaps(checkStart, checkEnd, b.start, b.end));

        if (!conflict) {
          slots.push({ startUtc: cursor, endUtc: slotEnd });
          emittedToday += 1;
          if (emittedToday >= cap) break;
        }

        cursor = new Date(cursor.getTime() + eventType.durationMinutes * 60_000);
      }
      if (emittedToday >= cap) break;
    }
  }

  return slots;
}

export type OccupiedKind = "weschedule" | "external";

export interface OccupiedInterval {
  startUtc: string;
  endUtc: string;
  kind: OccupiedKind;
  color?: EventColor;
  paid?: boolean;
}

interface OccupiedBookingInput {
  startUtc: Date;
  endUtc: Date;
  eventTypeId: { toString(): string };
  payment?: unknown;
}

interface OccupiedComputeArgs {
  bookings: OccupiedBookingInput[];
  eventTypeColors: Record<string, EventColor>;
  googleBusy: Array<{ start: Date; end: Date }>;
  minExternalMinutes?: number;
}

function subtractIntervals(
  base: Array<{ start: Date; end: Date }>,
  cuts: Array<{ start: Date; end: Date }>,
): Array<{ start: Date; end: Date }> {
  let pieces = base.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
  for (const cut of cuts) {
    const next: typeof pieces = [];
    for (const p of pieces) {
      if (cut.end <= p.start || cut.start >= p.end) {
        next.push(p);
        continue;
      }
      if (cut.start > p.start) next.push({ start: p.start, end: new Date(Math.min(cut.start.getTime(), p.end.getTime())) });
      if (cut.end < p.end) next.push({ start: new Date(Math.max(cut.end.getTime(), p.start.getTime())), end: p.end });
    }
    pieces = next.filter((p) => p.end > p.start);
  }
  return pieces;
}

export function computeOccupiedIntervals(args: OccupiedComputeArgs): OccupiedInterval[] {
  const { bookings, eventTypeColors, googleBusy, minExternalMinutes = 10 } = args;

  const wsItems: OccupiedInterval[] = bookings.map((b) => ({
    startUtc: b.startUtc.toISOString(),
    endUtc: b.endUtc.toISOString(),
    kind: "weschedule",
    color: eventTypeColors[b.eventTypeId.toString()],
    paid: Boolean(b.payment),
  }));

  const wsRanges = bookings.map((b) => ({ start: b.startUtc, end: b.endUtc }));
  const remainingExternal = subtractIntervals(googleBusy, wsRanges).filter(
    (p) => (p.end.getTime() - p.start.getTime()) / 60_000 >= minExternalMinutes,
  );

  const externalItems: OccupiedInterval[] = remainingExternal.map((p) => ({
    startUtc: p.start.toISOString(),
    endUtc: p.end.toISOString(),
    kind: "external",
  }));

  return [...wsItems, ...externalItems].sort((a, b) =>
    a.startUtc < b.startUtc ? -1 : a.startUtc > b.startUtc ? 1 : 0,
  );
}
