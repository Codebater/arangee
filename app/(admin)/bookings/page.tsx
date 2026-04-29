export const dynamic = "force-dynamic";

import { bookings } from "@/lib/collections";
import { BookingsTable } from "@/components/admin/BookingsTable";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab ?? "upcoming";
  const now = new Date();
  const filter =
    tab === "past"
      ? { status: "confirmed" as const, startUtc: { $lt: now } }
      : tab === "cancelled"
        ? { status: { $in: ["cancelled", "rescheduled"] as const } }
        : { status: "confirmed" as const, startUtc: { $gte: now } };
  const list = await (await bookings()).find(filter as any).sort({ startUtc: tab === "past" ? -1 : 1 }).limit(100).toArray();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display">Bookings</h1>
      </header>
      <nav className="flex gap-2 text-sm border-b border-[--color-border]">
        {[
          { id: "upcoming", label: "Upcoming" },
          { id: "past", label: "Past" },
          { id: "cancelled", label: "Cancelled" },
        ].map((t) => (
          <a
            key={t.id}
            href={`?tab=${t.id}`}
            className={`px-3 py-2 -mb-px ${tab === t.id ? "border-b-2 border-[--color-primary] text-[--color-ink]" : "text-[--color-ink-muted]"}`}
          >
            {t.label}
          </a>
        ))}
      </nav>
      <BookingsTable bookings={list} />
    </div>
  );
}
