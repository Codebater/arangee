"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierBadge, TIER_BADGE_DEFS } from "@/components/public/TierBadge";
import type { TierBadgeType } from "@/lib/types";
import { saveTierBadges } from "@/server-actions/branding";

const ALL: TierBadgeType[] = ["free", "pro", "king", "supporter", "developer"];

const REQUIREMENT: Record<TierBadgeType, string> = {
  free: "Free",
  pro: "Upgrade to Pro",
  king: "Donate €25+",
  supporter: "Donate €5+",
  developer: "Pro plan",
};

export function TierBadgesEditor({
  initial,
  entitled,
}: {
  initial: TierBadgeType[];
  entitled: TierBadgeType[];
}) {
  const entitledSet = new Set(entitled);
  const [picked, setPicked] = useState<Set<TierBadgeType>>(
    new Set(initial.filter((t) => entitledSet.has(t))),
  );
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty =
    picked.size !== initial.filter((t) => entitledSet.has(t)).length ||
    initial.filter((t) => entitledSet.has(t)).some((t) => !picked.has(t));

  function toggle(t: TierBadgeType) {
    if (!entitledSet.has(t)) return;
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function save() {
    start(async () => {
      const ordered = ALL.filter((t) => picked.has(t));
      await saveTierBadges(ordered);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ALL.map((t) => {
          const def = TIER_BADGE_DEFS[t];
          const active = picked.has(t);
          const locked = !entitledSet.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              aria-pressed={active}
              aria-disabled={locked}
              disabled={locked}
              title={locked ? REQUIREMENT[t] : def.label}
              className={`relative flex items-center gap-2 rounded-md border px-3 py-2 transition-colors duration-150 ${
                active
                  ? "border-primary bg-primary-tint"
                  : locked
                    ? "border-border bg-bg-elevated opacity-60 cursor-not-allowed"
                    : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <TierBadge type={t} size={22} />
              <span className="text-[12.5px] text-ink">{def.label}</span>
              {locked && (
                <Lock size={10} className="text-ink-muted" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-3">
        {savedAt && !dirty && !pending && (
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
            Saved
          </span>
        )}
        <Button type="button" onClick={save} disabled={pending || !dirty} className="gap-2">
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <span>Save tier badges</span>
          )}
        </Button>
      </div>
      <p className="text-[11.5px] text-ink-muted">
        Locked badges become available when you upgrade or donate. They render next to
        your name on the public profile.
      </p>
    </div>
  );
}
