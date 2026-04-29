import Link from "next/link";
import { bootstrap } from "@/lib/bootstrap";
import { bookings, integrations } from "@/lib/collections";
import { KpiTile } from "@/components/admin/KpiTile";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  await bootstrap();
  const col = await bookings();
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
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
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display">Dashboard</h1>
        <p className="text-[--color-ink-muted] text-sm mt-1">An overview of your bookings.</p>
      </header>

      {(!integ || integ.status !== "ACTIVE") && (
        <div className="rounded-xl border border-[--color-warning] bg-[--color-primary-tint] p-4 flex items-center justify-between">
          <p className="text-sm">Connect your Google Calendar to start accepting bookings.</p>
          <Button render={<Link href="/settings" />}>Connect</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiTile label="This week" value={thisWeek} />
        <KpiTile label="Next 7 days" value={next7} />
        <KpiTile label="This month" value={thisMonth} />
      </div>

      <section>
        <h2 className="text-lg font-display mb-3">Upcoming</h2>
        <div className="rounded-xl border border-[--color-border] bg-[--color-surface] divide-y divide-[--color-border]">
          {upcoming.length === 0 && <div className="p-5 text-sm text-[--color-ink-muted]">No upcoming bookings.</div>}
          {upcoming.map((b) => (
            <div key={b._id.toString()} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{b.guestName}</div>
                <div className="text-xs text-[--color-ink-muted]">{b.eventTypeSlug}</div>
              </div>
              <div className="font-mono text-sm tabular">
                {b.startUtc.toUTCString().slice(0, 22)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
