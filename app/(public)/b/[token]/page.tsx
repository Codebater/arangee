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
    <main className="max-w-xl mx-auto px-6 py-20 animate-fade-up">
      <h1 className="font-display text-3xl">Manage booking</h1>
      <p className="text-sm text-[--color-ink-muted] mt-2">{booking.guestName} · {booking.guestEmail}</p>
      <p className="font-mono mt-4">{labelDate} · {labelTime}</p>
      <div className="mt-8">
        <ManagePanel token={token} slug={booking.eventTypeSlug} />
      </div>
    </main>
  );
}
