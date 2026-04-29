"use client";

import { formatInTimeZone, toZonedTime } from "date-fns-tz";

interface Props {
  slots: { startUtc: string; endUtc: string }[];
  selectedDate: string;
  guestTimezone: string;
  onSelect: (slot: { startUtc: string; endUtc: string }) => void;
  selected?: string;
}

export function SlotPicker({
  slots,
  selectedDate,
  guestTimezone,
  onSelect,
  selected,
}: Props) {
  const dayStart = new Date(`${selectedDate}T00:00:00Z`);
  const dayEnd = new Date(`${selectedDate}T23:59:59Z`);
  const filtered = slots.filter((s) => {
    const z = toZonedTime(new Date(s.startUtc), guestTimezone);
    return z >= toZonedTime(dayStart, guestTimezone) && z <= toZonedTime(dayEnd, guestTimezone);
  });

  if (filtered.length === 0) {
    return (
      <p className="text-[13px] text-[--ink-muted] py-4">No times available.</p>
    );
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
            className={`font-mono text-[13px] tabular h-9 rounded-md border transition-colors duration-150 ${
              sel
                ? "bg-[--primary] text-[--primary-foreground] border-[--primary]"
                : "bg-[--surface] border-[--border] text-[--ink] hover:bg-[--surface-hover] hover:border-[--border-strong]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
