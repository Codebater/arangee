export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { bookings } from "@/lib/collections";
import { isValidTokenShape } from "@/lib/tokens";
import { ManagePanel } from "./manage-panel";

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidTokenShape(token)) notFound();
  const booking = await (await bookings()).findOne({ manageToken: token });
  if (!booking || booking.status !== "confirmed" || booking.endUtc < new Date()) notFound();

  const labelDate = formatInTimeZone(booking.startUtc, booking.guestTimezone, "EEEE, MMMM d");
  const labelTime = formatInTimeZone(booking.startUtc, booking.guestTimezone, "h:mm a");

  return (
    <main className="max-w-md mx-auto px-6 py-20 animate-fade-up">
      <div className="rounded-lg border border-[--border] bg-[--surface] p-6">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[--ink-muted]">
          Manage booking
        </p>
        <h1 className="text-xl mt-3">{booking.guestName}</h1>
        <p className="text-[12px] text-[--ink-muted]">{booking.guestEmail}</p>
        <p className="font-mono text-[13px] text-[--ink-soft] mt-4 pb-5 border-b border-[--border]">
          {labelDate} · {labelTime}
        </p>
        <div className="pt-5">
          <ManagePanel token={token} slug={booking.eventTypeSlug} />
        </div>
      </div>
    </main>
  );
}
