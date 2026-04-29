export const dynamic = "force-dynamic";

import Link from "next/link";
import { bootstrap } from "@/lib/bootstrap";
import { bookings, integrations } from "@/lib/collections";
import { KpiTile } from "@/components/admin/KpiTile";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  await bootstrap();
  const col = await bookings();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenAhead = new Date(now.getTime() + 7 * 24 * 3600_000);

  const [thisWeek, next7, thisMonth, upcoming, integ] = await Promise.all([
    col.countDocuments({ status: "confirmed", startUtc: { $gte: weekStart, $lt: now } }),
    col.countDocuments({ status: "confirmed", startUtc: { $gte: now, $lt: sevenAhead } }),
    col.countDocuments({ status: "confirmed", startUtc: { $gte: monthStart } }),
    col.find({ status: "confirmed", startUtc: { $gte: now } }).sort({ startUtc: 1 }).limit(5).toArray(),
    (await integrations()).findOne({ provider: "google_calendar" }),
  ]);

  return (
    <div className="relative space-y-9">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-10 h-64 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 18% 0%, var(--primary-tint), transparent 65%)",
        }}
      />
      <header className="flex items-end justify-between border-b border-[--border] pb-5">
        <div>
          <h1 className="text-2xl">Dashboard</h1>
          <p className="text-[--ink-muted] text-sm mt-1">An overview of your bookings.</p>
        </div>
      </header>

      {(!integ || integ.status !== "ACTIVE") && (
        <div className="rounded-lg border border-[--border] bg-[--primary-tint] px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-[--ink]">
            Connect your Google Calendar to start accepting bookings.
          </p>
          <Button nativeButton={false} size="sm" render={<Link href="/settings" />}>
            Connect
          </Button>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiTile label="This week" value={thisWeek} />
        <KpiTile label="Next 7 days" value={next7} />
        <KpiTile label="This month" value={thisMonth} />
      </section>

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-base">Upcoming</h2>
          <span className="text-[11px] uppercase tracking-[0.08em] text-[--ink-muted]">
            {upcoming.length} scheduled
          </span>
        </div>
        <div className="rounded-lg border border-[--border] bg-[--surface] divide-y divide-[--border] overflow-hidden">
          {upcoming.length === 0 && (
            <div className="p-6 text-sm text-[--ink-muted]">No upcoming bookings.</div>
          )}
          {upcoming.map((b) => (
            <div
              key={b._id.toString()}
              className="px-4 py-3 flex items-center justify-between hover:bg-[--surface-hover] transition-colors duration-150"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-[--ink] truncate">{b.guestName}</div>
                <div className="text-[11px] text-[--ink-muted] truncate">/{b.eventTypeSlug}</div>
              </div>
              <div className="font-mono text-[12px] tabular text-[--ink-soft] shrink-0 ml-4">
                {b.startUtc.toUTCString().slice(0, 22)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
