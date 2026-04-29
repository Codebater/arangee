"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { AvailabilityDoc } from "@/lib/types";
import { saveAvailability } from "@/server-actions/availability";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Editable = {
  timezone: string;
  weeklyHours: AvailabilityDoc["weeklyHours"];
  dateOverrides: AvailabilityDoc["dateOverrides"];
};

export function AvailabilityEditor({ initial }: { initial: Editable }) {
  const [state, setState] = useState<Editable>(initial);
  const [pending, start] = useTransition();

  function setIntervals(dayOfWeek: number, intervals: { start: string; end: string }[]) {
    const next = state.weeklyHours.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, intervals } : d));
    setState({ ...state, weeklyHours: next });
  }

  function addOverride() {
    const today = new Date().toISOString().slice(0, 10);
    setState({
      ...state,
      dateOverrides: [...state.dateOverrides, { date: today, intervals: [] }],
    });
  }

  function submit() {
    const fd = new FormData();
    fd.append("payload", JSON.stringify(state));
    start(() => saveAvailability(fd));
  }

  return (
    <form action={submit} className="space-y-10">
      <section className="space-y-3">
        <Label>Timezone</Label>
        <Input
          value={state.timezone}
          onChange={(e) => setState({ ...state, timezone: e.target.value })}
          placeholder="Europe/Copenhagen"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base">Weekly hours</h2>
        <div className="rounded-lg border border-[--border] divide-y divide-[--border]">
          {state.weeklyHours.map((d) => (
            <div key={d.dayOfWeek} className="p-4 flex flex-col md:flex-row md:items-start gap-4">
              <div className="w-16 font-mono text-sm tabular text-[--ink-muted]">{dayNames[d.dayOfWeek]}</div>
              <div className="flex-1 space-y-2">
                {d.intervals.length === 0 && <p className="text-xs text-[--ink-muted]">Unavailable</p>}
                {d.intervals.map((iv, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      className="w-28 font-mono"
                      value={iv.start}
                      onChange={(e) => {
                        const next = [...d.intervals];
                        next[idx] = { ...iv, start: e.target.value };
                        setIntervals(d.dayOfWeek, next);
                      }}
                    />
                    <span>—</span>
                    <Input
                      className="w-28 font-mono"
                      value={iv.end}
                      onChange={(e) => {
                        const next = [...d.intervals];
                        next[idx] = { ...iv, end: e.target.value };
                        setIntervals(d.dayOfWeek, next);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setIntervals(d.dayOfWeek, d.intervals.filter((_, i) => i !== idx))}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIntervals(d.dayOfWeek, [...d.intervals, { start: "09:00", end: "17:00" }])}
                >
                  <Plus size={14} className="mr-1" /> Add interval
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base">Date overrides</h2>
          <Button type="button" variant="outline" size="sm" onClick={addOverride}>
            <Plus size={14} className="mr-1" /> Add override
          </Button>
        </div>
        <div className="space-y-3">
          {state.dateOverrides.length === 0 && <p className="text-sm text-[--ink-muted]">No overrides.</p>}
          {state.dateOverrides.map((o, oi) => (
            <div key={oi} className="rounded-lg border border-[--border] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  className="w-44 font-mono"
                  value={o.date}
                  onChange={(e) => {
                    const next = [...state.dateOverrides];
                    next[oi] = { ...o, date: e.target.value };
                    setState({ ...state, dateOverrides: next });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setState({ ...state, dateOverrides: state.dateOverrides.filter((_, i) => i !== oi) })}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              {o.intervals.length === 0 && <p className="text-xs text-[--ink-muted]">Blocked entirely</p>}
              {o.intervals.map((iv, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    className="w-28 font-mono"
                    value={iv.start}
                    onChange={(e) => {
                      const next = [...state.dateOverrides];
                      next[oi]!.intervals[idx] = { ...iv, start: e.target.value };
                      setState({ ...state, dateOverrides: next });
                    }}
                  />
                  <span>—</span>
                  <Input
                    className="w-28 font-mono"
                    value={iv.end}
                    onChange={(e) => {
                      const next = [...state.dateOverrides];
                      next[oi]!.intervals[idx] = { ...iv, end: e.target.value };
                      setState({ ...state, dateOverrides: next });
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = [...state.dateOverrides];
                  next[oi]!.intervals = [...next[oi]!.intervals, { start: "09:00", end: "17:00" }];
                  setState({ ...state, dateOverrides: next });
                }}
              >
                <Plus size={14} className="mr-1" /> Add interval
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 bg-[--bg] py-4 -mx-2 px-2 border-t border-[--border]">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save availability"}</Button>
      </div>
    </form>
  );
}
