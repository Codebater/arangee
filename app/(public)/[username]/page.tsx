export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { findUserByUsername, listActiveEventTypes } from "@/lib/scope";
import { isReservedUsername } from "@/lib/users";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ProfileHeader } from "@/components/public/ProfileHeader";

const colorMap: Record<string, string> = {
  iris: "var(--event-iris)",
  rose: "var(--event-rose)",
  amber: "var(--event-amber)",
  sage: "var(--event-sage)",
  slate: "var(--event-slate)",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (isReservedUsername(username)) return {};
  const user = await findUserByUsername(username);
  if (!user) return {};
  return {
    title: `${user.name} · WeSchedule`,
    description: user.bio || `Book a meeting with ${user.name}.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (isReservedUsername(username)) notFound();
  const user = await findUserByUsername(username);
  if (!user) notFound();
  const events = await listActiveEventTypes(user._id);

  return (
    <main className="relative mx-auto max-w-3xl px-6 pb-16 pt-6 md:pt-10 animate-fade-in">
      <div className="mb-10 flex items-center justify-end">
        <ThemeToggle />
      </div>

      <ProfileHeader
        name={user.name}
        username={user.username}
        bio={user.bio}
        avatarImageId={user.branding?.avatarImageId?.toString() ?? null}
        bannerImageId={user.branding?.bannerImageId?.toString() ?? null}
      />

      <section className="mt-2">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Pick a meeting
        </p>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg-elevated px-6 py-14 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              No event types yet
            </p>
            <p className="text-[13px] text-ink-soft">
              {user.name} hasn&apos;t published any meeting types.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {events.map((evt) => {
              const accent = colorMap[evt.color];
              const locationLabel =
                evt.location.type === "google_meet"
                  ? "Google Meet"
                  : evt.location.type === "phone"
                    ? "Phone"
                    : "In-person";
              return (
                <li key={evt._id.toString()}>
                  <Link
                    href={`/${user.username}/${evt.slug}`}
                    className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover"
                  >
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: accent }}
                      />
                      {evt.durationMinutes} min
                    </div>
                    <h2 className="text-[18px] font-medium tracking-[-0.01em] text-ink">
                      {evt.title}
                    </h2>
                    {evt.description && (
                      <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
                        {evt.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={11} className="text-ink-faint" />
                          {evt.durationMinutes} min
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={11} className="text-ink-faint" />
                          {locationLabel}
                        </span>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-ink-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
