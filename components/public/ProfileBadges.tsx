import type { ProfileBadge } from "@/lib/types";

const COLOR_CLASSES: Record<ProfileBadge["color"], string> = {
  primary: "bg-primary-tint text-primary border-primary/25",
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-300",
  green: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-300",
  amber: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-300",
  slate: "bg-slate-500/10 text-slate-700 border-slate-500/25 dark:text-slate-300",
};

export function ProfileBadges({ badges }: { badges: ProfileBadge[] }) {
  if (!badges.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <li
          key={b.id}
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] ${COLOR_CLASSES[b.color]}`}
        >
          {b.label}
        </li>
      ))}
    </ul>
  );
}
