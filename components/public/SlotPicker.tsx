"use client";

import { formatInTimeZone, toZonedTime } from "date-fns-tz";

interface Props {
  slots: { startUtc: string; endUtc: string }[];
  selectedDate: string;
  guestTimezone: string;
  onSelect: (slot: { startUtc: string; endUtc: string }) => void;
  selected?: string;
}

export function SlotPicker({ slots, selectedDate, guestTimezone, onSelect, selected }: Props) {
  const dayStart = new Date(`${selectedDate}T00:00:00Z`);
  const dayEnd = new Date(`${selectedDate}T23:59:59Z`);
  const filtered = slots.filter((s) => {
    const z = toZonedTime(new Date(s.startUtc), guestTimezone);
    return z >= toZonedTime(dayStart, guestTimezone) && z <= toZonedTime(dayEnd, guestTimezone);
  });

  if (filtered.length === 0) {
    return <p className="text-sm text-[--color-ink-muted]">No times available.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {filtered.map((s) => {
        const label = formatInTimeZone(new Date(s.startUtc), guestTimezone, "h:mm a");
        const sel = selected === s.startUtc;
        return (
          <button
            key={s.startUtc}
            type="button"
            onClick={() => onSelect(s)}
            className={`font-mono text-sm tabular rounded-md border px-3 py-2 transition-colors ${
              sel ? "bg-[--color-primary] text-[--color-primary-ink] border-[--color-primary]" : "bg-[--color-surface] border-[--color-border] hover:bg-[--color-primary-tint]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
