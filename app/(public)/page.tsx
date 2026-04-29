export const dynamic = "force-dynamic";

import Link from "next/link";
import { eventTypes, users } from "@/lib/collections";
import { Wordmark } from "@/components/brand/Wordmark";

const colorMap: Record<string, string> = {
  iris: "var(--event-iris)",
  rose: "var(--event-rose)",
  amber: "var(--event-amber)",
  sage: "var(--event-sage)",
  slate: "var(--event-slate)",
};

export default async function ProfilePage() {
  const [user, list] = await Promise.all([
    (await users()).findOne({}),
    (await eventTypes()).find({ active: true }).sort({ position: 1 }).toArray(),
  ]);

  return (
    <main className="relative max-w-3xl mx-auto px-6 py-16 md:py-24 animate-fade-up">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 20% 0%, var(--primary-tint), transparent 65%)",
        }}
      />
      <Wordmark size={22} className="text-[--ink-soft]" />
      <header className="mt-14 space-y-3">
        <h1 className="text-4xl md:text-5xl">{user?.name ?? "Kalendly"}</h1>
        {user?.bio && (
          <p className="text-base md:text-lg text-[--ink-soft] max-w-xl leading-relaxed">
            {user.bio}
          </p>
        )}
      </header>
      <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map((e) => (
          <Link
            href={`/${e.slug}`}
            key={e._id.toString()}
            className="group relative rounded-lg border border-[--border] bg-[--surface] overflow-hidden transition-colors duration-150 hover:border-[--border-strong]"
          >
            <div
              className="h-[2px] w-full"
              style={{ background: colorMap[e.color] }}
            />
            <div className="p-5">
              <h3 className="text-lg text-[--ink]">{e.title}</h3>
              <p className="font-mono text-[11px] text-[--ink-muted] mt-1">
                {e.durationMinutes} min
              </p>
              {e.description && (
                <p className="text-[13px] text-[--ink-soft] mt-3 line-clamp-2 leading-relaxed">
                  {e.description}
                </p>
              )}
              <p className="text-[11px] uppercase tracking-[0.08em] text-[--primary] mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                Schedule →
              </p>
            </div>
          </Link>
        ))}
        {list.length === 0 && (
          <div className="md:col-span-2 rounded-lg border border-dashed border-[--border] py-12 text-center text-sm text-[--ink-muted]">
            No event types available.
          </div>
        )}
      </section>
      <footer className="mt-20 text-[11px] uppercase tracking-[0.08em] text-[--ink-muted]">
        Powered by Kalendly
      </footer>
    </main>
  );
}
