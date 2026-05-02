"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProfileBadge, BadgeColor } from "@/lib/types";
import { saveProfileBadges } from "@/server-actions/branding";

const COLOR_OPTIONS: { id: BadgeColor; label: string; chip: string }[] = [
  { id: "primary", label: "Accent", chip: "bg-primary text-primary-foreground" },
  { id: "blue", label: "Blue", chip: "bg-blue-500 text-white" },
  { id: "green", label: "Green", chip: "bg-emerald-500 text-white" },
  { id: "amber", label: "Amber", chip: "bg-amber-500 text-white" },
  { id: "rose", label: "Rose", chip: "bg-rose-500 text-white" },
  { id: "slate", label: "Slate", chip: "bg-slate-500 text-white" },
];

interface Props {
  initial: ProfileBadge[];
}

export function BadgesEditor({ initial }: Props) {
  const [badges, setBadges] = useState<ProfileBadge[]>(initial);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dirty = JSON.stringify(badges) !== JSON.stringify(initial);

  function addBadge() {
    setBadges((cur) => [
      ...cur,
      { id: crypto.randomUUID(), label: "", color: "primary" as BadgeColor },
    ]);
  }

  function patch(id: string, change: Partial<ProfileBadge>) {
    setBadges((cur) => cur.map((b) => (b.id === id ? { ...b, ...change } : b)));
  }

  function remove(id: string) {
    setBadges((cur) => cur.filter((b) => b.id !== id));
  }

  function save() {
    start(async () => {
      const payload = badges.filter((b) => b.label.trim().length > 0);
      await saveProfileBadges(payload);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="space-y-3">
      {badges.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-bg-elevated px-4 py-6 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          No badges yet
        </div>
      ) : (
        <ul className="space-y-2">
          {badges.map((badge) => (
            <li
              key={badge.id}
              className="flex items-center gap-2 rounded-md border border-border bg-surface p-2"
            >
              <Input
                value={badge.label}
                onChange={(e) => patch(badge.id, { label: e.target.value })}
                placeholder="e.g. Open to work"
                maxLength={24}
                className="h-8 max-w-[260px] flex-1 text-[12.5px]"
              />
              <div className="flex items-center gap-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={c.label}
                    onClick={() => patch(badge.id, { color: c.id })}
                    className={`h-5 w-5 rounded-full ring-offset-2 ring-offset-bg ${c.chip} ${
                      badge.color === c.id ? "ring-2 ring-ink" : ""
                    }`}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(badge.id)}
                className="ml-auto text-ink-muted hover:text-danger"
              >
                <Trash2 size={13} />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addBadge}
          className="gap-1.5"
          disabled={badges.length >= 8}
        >
          <Plus size={13} />
          Add badge
        </Button>
        <div className="flex items-center gap-3">
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
              <span>Save badges</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
