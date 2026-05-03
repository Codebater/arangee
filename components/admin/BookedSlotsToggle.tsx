"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { saveBookedSlotsVisibility } from "@/server-actions/branding";

export function BookedSlotsToggle({ initialHidden }: { initialHidden: boolean }) {
  const [hidden, setHidden] = useState(initialHidden);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function onChange(value: boolean) {
    setHidden(value);
    setSavedAt(null);
    start(async () => {
      await saveBookedSlotsVisibility(value);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface px-3.5 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="hide-booked" className="text-[13px] text-ink">
            Hide booked slots from your public profile
          </Label>
          <p className="text-[11.5px] text-ink-muted">
            Guests won&apos;t see when you&apos;re booked or busy. By default the slot picker
            shows colored pills for booked times and gray &quot;Busy&quot; blocks for other
            calendar events.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <Switch
            id="hide-booked"
            checked={hidden}
            onCheckedChange={onChange}
            disabled={pending}
            aria-label="Hide booked slots"
          />
          {savedAt && !pending && (
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
