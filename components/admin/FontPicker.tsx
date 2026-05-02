"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLIC_FONT_OPTIONS, type FontChoice } from "@/lib/fonts";
import { saveFont } from "@/server-actions/branding";

const SAMPLE_FONT_FAMILY: Record<FontChoice, string> = {
  geist: "var(--font-public-geist), ui-sans-serif",
  inter: "var(--font-public-inter), ui-sans-serif",
  manrope: "var(--font-public-manrope), ui-sans-serif",
  "ibm-plex": "var(--font-public-ibm-plex), ui-sans-serif",
};

interface Props {
  current: FontChoice | null;
}

export function FontPicker({ current }: Props) {
  const [selected, setSelected] = useState<FontChoice | null>(current);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dirty = selected !== current;

  function save() {
    start(async () => {
      await saveFont(selected);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {PUBLIC_FONT_OPTIONS.map((f) => {
          const active = selected === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelected(active ? null : f.id)}
              aria-pressed={active}
              className={`flex items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 text-left transition-colors duration-150 ${
                active
                  ? "border-primary bg-primary-tint"
                  : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <div className="min-w-0">
                <div
                  className="text-[15px] text-ink"
                  style={{ fontFamily: SAMPLE_FONT_FAMILY[f.id] }}
                >
                  {f.label}
                </div>
                <div className="mt-0.5 text-[11.5px] text-ink-muted">{f.description}</div>
              </div>
              <span
                className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  active ? "border-primary bg-primary" : "border-border-strong bg-surface"
                }`}
              >
                {active && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                )}
              </span>
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
          className="text-ink-muted hover:text-ink"
        >
          Use default
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
              <span>Save font</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
