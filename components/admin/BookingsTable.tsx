import type { BookingDoc } from "@/lib/types";

export function BookingsTable({ bookings }: { bookings: BookingDoc[] }) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[--color-border] p-10 text-center">
        <p className="text-[--color-ink-muted] text-sm">No bookings.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface] divide-y divide-[--color-border]">
      {bookings.map((b) => (
        <div key={b._id.toString()} className="p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{b.guestName}</div>
            <div className="text-xs text-[--color-ink-muted]">{b.guestEmail} · /{b.eventTypeSlug}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm tabular">{b.startUtc.toUTCString().slice(0, 22)}</div>
            <div className="text-xs uppercase tracking-wide text-[--color-ink-muted]">{b.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
