import type { BookingDoc } from "@/lib/types";

const statusStyle: Record<string, string> = {
  confirmed: "text-[--success]",
  cancelled: "text-[--ink-muted]",
  rescheduled: "text-[--warning]",
};

export function BookingsTable({ bookings }: { bookings: BookingDoc[] }) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[--border] py-14 text-center">
        <p className="text-[--ink-muted] text-sm">No bookings.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-[--border] bg-[--surface] divide-y divide-[--border] overflow-hidden">
      {bookings.map((b) => (
        <div
          key={b._id.toString()}
          className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-[--surface-hover] transition-colors duration-150"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium text-[--ink] truncate">{b.guestName}</div>
            <div className="text-[11px] text-[--ink-muted] truncate">
              {b.guestEmail} · /{b.eventTypeSlug}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-[12px] tabular text-[--ink-soft]">
              {b.startUtc.toUTCString().slice(0, 22)}
            </div>
            <div
              className={`text-[10px] uppercase tracking-[0.08em] ${statusStyle[b.status] ?? "text-[--ink-muted]"}`}
            >
              {b.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
