"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROFILE_CARDS, type ProfileCardId } from "@/lib/profile-cards";
import { saveProfileCard } from "@/server-actions/branding";

interface Props {
  current: ProfileCardId | null;
}

export function ProfileCardPicker({ current }: Props) {
  const [selected, setSelected] = useState<ProfileCardId | null>(current);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dirty = selected !== current;

  function pick(id: ProfileCardId) {
    setSelected((cur) => (cur === id ? null : id));
  }

  function save() {
    start(async () => {
      await saveProfileCard(selected ? { template: selected } : null);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {PROFILE_CARDS.map((c) => {
          const Component = c.Component;
          const active = selected === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c.id)}
              aria-pressed={active}
              className={`group relative overflow-hidden rounded-lg border text-left transition-colors duration-150 ${
                active
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <div className="relative aspect-[20/3] w-full overflow-hidden">
                <Component />
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2 bg-surface">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">{c.label}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-ink-muted">
                    {c.description}
                  </p>
                </div>
                {active && (
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSelected(null)}
          disabled={!selected}
          className="gap-1.5 text-ink-muted hover:text-ink"
        >
          <X size={13} />
          No animated card
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
              <span>Save card</span>
            )}
          </Button>
        </div>
      </div>
      <p className="text-[11.5px] text-ink-muted">
        Animated cards replace your banner image on the public profile.
      </p>
    </div>
  );
}
