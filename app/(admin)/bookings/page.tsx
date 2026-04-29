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
  const list = await (await bookings())
    .find(filter as any)
    .sort({ startUtc: tab === "past" ? -1 : 1 })
    .limit(100)
    .toArray();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between border-b border-[--border] pb-5">
        <div>
          <h1 className="text-2xl">Bookings</h1>
          <p className="text-[--ink-muted] text-sm mt-1">All scheduled meetings.</p>
        </div>
      </header>
      <nav className="flex gap-1 -mb-px">
        {[
          { id: "upcoming", label: "Upcoming" },
          { id: "past", label: "Past" },
          { id: "cancelled", label: "Cancelled" },
        ].map((t) => (
          <a
            key={t.id}
            href={`?tab=${t.id}`}
            className={`inline-flex items-center h-7 px-2.5 rounded-md text-[13px] transition-colors duration-150 ${
              tab === t.id
                ? "bg-[--surface-hover] text-[--ink] font-medium"
                : "text-[--ink-muted] hover:bg-[--surface-hover] hover:text-[--ink]"
            }`}
          >
            {t.label}
          </a>
        ))}
      </nav>
      <BookingsTable bookings={list} />
    </div>
  );
}
