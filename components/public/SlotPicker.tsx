"use client";

import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookedSlotPill } from "./BookedSlotPill";
import type { OccupiedInterval } from "@/lib/availability";

interface Props {
  slots: { startUtc: string; endUtc: string }[];
  occupied?: OccupiedInterval[];
  selectedDate: string;
  guestTimezone: string;
  onSelect: (slot: { startUtc: string; endUtc: string }) => void;
  onClear?: () => void;
  selected?: string;
}

type Item =
  | { kind: "open"; slot: { startUtc: string; endUtc: string } }
  | { kind: "occupied"; interval: OccupiedInterval };

export function SlotPicker({
  slots,
  occupied = [],
  selectedDate,
  guestTimezone,
  onSelect,
  onClear,
  selected,
}: Props) {
  const dayStart = new Date(`${selectedDate}T00:00:00Z`);
  const dayEnd = new Date(`${selectedDate}T23:59:59Z`);

  const inDay = (iso: string) => {
    const z = toZonedTime(new Date(iso), guestTimezone);
    return (
      z >= toZonedTime(dayStart, guestTimezone) && z <= toZonedTime(dayEnd, guestTimezone)
    );
  };

  const openItems: Item[] = slots.filter((s) => inDay(s.startUtc)).map((slot) => ({
    kind: "open",
    slot,
  }));
  const occupiedItems: Item[] = occupied
    .filter((o) => inDay(o.startUtc))
    .map((interval) => ({ kind: "occupied", interval }));

  const items: Item[] = [...openItems, ...occupiedItems].sort((a, b) => {
    const aStart = a.kind === "open" ? a.slot.startUtc : a.interval.startUtc;
    const bStart = b.kind === "open" ? b.slot.startUtc : b.interval.startUtc;
    return aStart < bStart ? -1 : aStart > bStart ? 1 : 0;
  });

  if (items.length === 0) {
    return (
      <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-bg-elevated px-4 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          No times on this day
        </p>
        {onClear && (
          <Button type="button" variant="outline" size="sm" onClick={onClear} className="gap-1.5">
            <ArrowLeft />
            Pick another day
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label="Available times"
      className="grid max-h-[440px] grid-cols-2 gap-1.5 overflow-y-auto pr-1 animate-fade-in"
    >
      {items.map((item, i) => {
        if (item.kind === "open") {
          const s = item.slot;
          const label = formatInTimeZone(new Date(s.startUtc), guestTimezone, "h:mm a");
          const isSelected = selected === s.startUtc;
          return (
            <button
              key={`open-${s.startUtc}`}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(s)}
              style={{ animationDelay: `${Math.min(i * 18, 240)}ms` }}
              className={[
                "group/slot inline-flex h-10 items-center justify-center rounded-md border px-2 font-mono text-[13px] tabular transition-all duration-150 outline-none animate-fade-up",
                "focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_var(--primary-tint)]"
                  : "border-border bg-surface text-ink hover:border-ink-faint hover:bg-surface-hover hover:-translate-y-px",
              ].join(" ")}
            >
              <span className="tracking-tight">{label}</span>
            </button>
          );
        }
        const o = item.interval;
        const label = formatInTimeZone(new Date(o.startUtc), guestTimezone, "h:mm a");
        return (
          <div
            key={`occ-${o.startUtc}-${i}`}
            style={{ animationDelay: `${Math.min(i * 18, 240)}ms` }}
            className="animate-fade-up"
          >
            <BookedSlotPill time={label} kind={o.kind} color={o.color} paid={o.paid} />
          </div>
        );
      })}
    </div>
  );
}
