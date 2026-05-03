import type { EventColor } from "@/lib/types";

interface Props {
  time: string;
  kind: "weschedule" | "external";
  color?: EventColor;
  paid?: boolean;
}

export function BookedSlotPill({ time, kind, color, paid }: Props) {
  if (kind === "external") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-elevated px-3 py-2 text-[11.5px] text-ink-muted opacity-70">
        <span className="font-mono tabular">{time}</span>
        <span className="font-mono uppercase tracking-[0.1em] text-[9.5px]">Busy</span>
      </div>
    );
  }
  const accent = `var(--event-${color ?? "slate"})`;
  const ringStyle: React.CSSProperties | undefined = paid
    ? { boxShadow: `0 0 0 1px ${accent}, 0 0 12px -2px ${accent}` }
    : undefined;
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[11.5px]"
      style={{
        background: `color-mix(in oklab, ${accent} 14%, transparent)`,
        color: accent,
        ...ringStyle,
      }}
      aria-disabled
    >
      <span className="font-mono tabular">{time}</span>
      <span className="font-mono uppercase tracking-[0.1em] text-[9.5px]">
        {paid ? "Booked · Paid" : "Booked"}
      </span>
    </div>
  );
}
