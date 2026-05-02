import { PlatformIcon } from "./PlatformIcon";
import type { ProfileLink } from "@/lib/types";
import { findPlatform } from "@/lib/link-platforms";

export function ProfileLinks({ links }: { links: ProfileLink[] }) {
  if (!links.length) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-1.5">
      {links.map((l) => {
        const def = findPlatform(l.platform);
        const label = l.label ?? def.label;
        return (
          <li key={l.id}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-[12px] text-ink-soft transition-colors duration-150 hover:border-border-strong hover:bg-surface-hover hover:text-ink"
              title={label}
            >
              <PlatformIcon platform={l.platform} size={12} className="text-ink-muted" />
              <span className="font-mono uppercase tracking-[0.06em] text-[10.5px]">
                {label}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
