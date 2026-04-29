export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { eventTypes } from "@/lib/collections";
import { BookingForm } from "@/components/public/BookingForm";

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ start?: string; tz?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const startIso = sp.start;
  const tz = sp.tz ?? "UTC";
  if (!startIso) notFound();

  const evt = await (await eventTypes()).findOne({ slug, active: true });
  if (!evt) notFound();

  const dt = new Date(startIso);
  const labelDate = formatInTimeZone(dt, tz, "EEEE, MMMM d");
  const labelTime = formatInTimeZone(dt, tz, "h:mm a");

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-16 animate-fade-up">
      <a href={`/${slug}`} className="text-sm text-[--color-ink-muted] hover:text-[--color-ink]">← back</a>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-10">
        <aside className="md:col-span-2 space-y-3">
          <div className="h-1 w-12 rounded-full" style={{ background: `var(--color-event-${evt.color})` }} />
          <h1 className="font-display text-3xl">{evt.title}</h1>
          <p className="font-mono text-xs text-[--color-ink-muted]">{evt.durationMinutes} min</p>
          <p className="text-sm font-mono">{labelDate} · {labelTime}</p>
        </aside>
        <section className="md:col-span-3">
          <BookingForm slug={slug} startUtc={startIso} guestTimezone={tz} customQuestions={evt.customQuestions} />
        </section>
      </div>
    </main>
  );
}
