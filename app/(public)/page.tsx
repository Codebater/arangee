export const dynamic = "force-dynamic";

import Link from "next/link";
import { eventTypes, users } from "@/lib/collections";
import { Wordmark } from "@/components/brand/Wordmark";

const colorMap: Record<string, string> = {
  iris: "var(--color-event-iris)",
  rose: "var(--color-event-rose)",
  amber: "var(--color-event-amber)",
  sage: "var(--color-event-sage)",
  slate: "var(--color-event-slate)",
};

export default async function ProfilePage() {
  const [user, list] = await Promise.all([
    (await users()).findOne({}),
    (await eventTypes()).find({ active: true }).sort({ position: 1 }).toArray(),
  ]);

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 md:py-28 animate-fade-up">
      <Wordmark className="h-7 w-auto opacity-70" />
      <header className="mt-12 space-y-3">
        <h1 className="font-display text-5xl md:text-6xl tracking-tight">{user?.name ?? "Kalendly"}</h1>
        {user?.bio && <p className="text-lg text-[--color-ink-soft] max-w-xl">{user.bio}</p>}
      </header>
      <section className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((e) => (
          <Link
            href={`/${e.slug}`}
            key={e._id.toString()}
            className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 hover:shadow-[0_8px_24px_-12px_rgba(26,22,37,0.10)] transition-shadow"
          >
            <div className="h-1 w-12 rounded-full mb-4" style={{ background: colorMap[e.color] }} />
            <h3 className="font-display text-2xl">{e.title}</h3>
            <p className="font-mono text-xs text-[--color-ink-muted] mt-1">{e.durationMinutes} min</p>
            {e.description && <p className="text-sm text-[--color-ink-soft] mt-3 line-clamp-2">{e.description}</p>}
          </Link>
        ))}
      </section>
      <footer className="mt-24 text-xs text-[--color-ink-muted]">Powered by Kalendly</footer>
    </main>
  );
}
