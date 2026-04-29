"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import type { EventTypeDoc, EventColor, CustomQuestion, LocationSpec } from "@/lib/types";
import { createEventType, updateEventType } from "@/server-actions/event-types";

type FormState = {
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  color: EventColor;
  location: LocationSpec;
  rules: EventTypeDoc["rules"];
  customQuestions: CustomQuestion[];
  active: boolean;
};

const colors: EventColor[] = ["iris", "rose", "amber", "sage", "slate"];

export function EventTypeForm({ existingId, initial }: { existingId?: string; initial?: FormState }) {
  const [state, setState] = useState<FormState>(initial ?? {
    slug: "",
    title: "",
    description: "",
    durationMinutes: 30,
    color: "iris",
    location: { type: "google_meet" },
    rules: {
      bufferBeforeMin: 0,
      bufferAfterMin: 0,
      minNoticeMinutes: 240,
      maxAdvanceDays: 60,
      maxBookingsPerDay: null,
    },
    customQuestions: [],
    active: true,
  });
  const [pending, start] = useTransition();

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function patchRules<K extends keyof EventTypeDoc["rules"]>(k: K, v: EventTypeDoc["rules"][K]) {
    setState((s) => ({ ...s, rules: { ...s.rules, [k]: v } }));
  }

  function addQuestion() {
    setState((s) => ({
      ...s,
      customQuestions: [
        ...s.customQuestions,
        { id: crypto.randomUUID(), label: "", type: "short_text", required: false },
      ],
    }));
  }

  function removeQuestion(id: string) {
    setState((s) => ({ ...s, customQuestions: s.customQuestions.filter((q) => q.id !== id) }));
  }

  function submit() {
    const fd = new FormData();
    fd.append("payload", JSON.stringify(state));
    start(async () => {
      if (existingId) await updateEventType(existingId, fd);
      else await createEventType(fd);
    });
  }

  return (
    <form action={submit} className="space-y-10">
      {/* Basics */}
      <section className="space-y-5">
        <h2 className="text-base">Basics</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={state.title} onChange={(e) => patch("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input id="slug" value={state.slug} onChange={(e) => patch("slug", e.target.value.toLowerCase())} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} value={state.description} onChange={(e) => patch("description", e.target.value)} />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 45, 60, 90].map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={state.durationMinutes === m ? "default" : "outline"}
                  onClick={() => patch("durationMinutes", m)}
                >
                  {m}
                </Button>
              ))}
              <Input
                type="number"
                value={state.durationMinutes}
                onChange={(e) => patch("durationMinutes", Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => patch("color", c)}
                  className={`h-7 w-7 rounded-full border-2 ${state.color === c ? "border-[--ink]" : "border-transparent"}`}
                  style={{ background: `var(--color-event-${c})` }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="space-y-5">
        <h2 className="text-base">Location</h2>
        <div className="space-y-2">
          {(["google_meet", "phone", "custom"] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="location-type"
                checked={state.location.type === t}
                onChange={() => {
                  if (t === "google_meet") patch("location", { type: "google_meet" });
                  if (t === "phone") patch("location", { type: "phone", phoneNumber: "" });
                  if (t === "custom") patch("location", { type: "custom", customText: "" });
                }}
              />
              {t === "google_meet" ? "Google Meet (auto)" : t === "phone" ? "Phone" : "Custom"}
            </label>
          ))}
        </div>
        {state.location.type === "phone" && (
          <Input
            placeholder="+45 ..."
            value={state.location.phoneNumber}
            onChange={(e) => patch("location", { type: "phone", phoneNumber: e.target.value })}
          />
        )}
        {state.location.type === "custom" && (
          <Textarea
            rows={2}
            placeholder="Zoom link or address"
            value={state.location.customText}
            onChange={(e) => patch("location", { type: "custom", customText: e.target.value })}
          />
        )}
      </section>

      {/* Rules */}
      <section className="space-y-5">
        <h2 className="text-base">Scheduling rules</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Buffer before (min)</Label>
            <Input type="number" value={state.rules.bufferBeforeMin} onChange={(e) => patchRules("bufferBeforeMin", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Buffer after (min)</Label>
            <Input type="number" value={state.rules.bufferAfterMin} onChange={(e) => patchRules("bufferAfterMin", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Min notice (min)</Label>
            <Input type="number" value={state.rules.minNoticeMinutes} onChange={(e) => patchRules("minNoticeMinutes", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Max advance (days)</Label>
            <Input type="number" value={state.rules.maxAdvanceDays} onChange={(e) => patchRules("maxAdvanceDays", Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Max bookings per day (blank = unlimited)</Label>
            <Input
              type="number"
              value={state.rules.maxBookingsPerDay ?? ""}
              onChange={(e) => patchRules("maxBookingsPerDay", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* Custom questions */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base">Custom questions</h2>
          <Button type="button" variant="outline" onClick={addQuestion}><Plus size={16} className="mr-2" /> Add question</Button>
        </div>
        <div className="space-y-3">
          {state.customQuestions.map((q, idx) => (
            <div key={q.id} className="rounded-lg border border-[--border] p-4 space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <Input
                  placeholder="Label"
                  value={q.label}
                  onChange={(e) => {
                    const next = [...state.customQuestions];
                    next[idx] = { ...q, label: e.target.value } as CustomQuestion;
                    setState((s) => ({ ...s, customQuestions: next }));
                  }}
                />
                <select
                  value={q.type}
                  onChange={(e) => {
                    const t = e.target.value as CustomQuestion["type"];
                    const base = { id: q.id, label: q.label, required: q.required };
                    const next = [...state.customQuestions];
                    next[idx] = t === "select" ? { ...base, type: "select", options: ["Option 1"] } : { ...base, type: t };
                    setState((s) => ({ ...s, customQuestions: next }));
                  }}
                  className="h-9 rounded-md border border-[--border] bg-[--surface] px-2 text-sm"
                >
                  <option value="short_text">Short text</option>
                  <option value="long_text">Long text</option>
                  <option value="select">Dropdown</option>
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => {
                      const next = [...state.customQuestions];
                      next[idx] = { ...q, required: e.target.checked };
                      setState((s) => ({ ...s, customQuestions: next }));
                    }}
                  />
                  Required
                </label>
              </div>
              {q.type === "select" && (
                <Textarea
                  rows={2}
                  placeholder="One option per line"
                  value={q.options.join("\n")}
                  onChange={(e) => {
                    const next = [...state.customQuestions];
                    next[idx] = { ...q, options: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) };
                    setState((s) => ({ ...s, customQuestions: next }));
                  }}
                />
              )}
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(q.id)}>
                  <Trash2 size={14} className="mr-1" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Status */}
      <section className="space-y-5">
        <h2 className="text-base">Status</h2>
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={state.active} onCheckedChange={(v) => patch("active", v)} />
          {state.active ? "Active" : "Hidden"}
        </label>
      </section>

      <div className="flex gap-3 pt-4 border-t border-[--border]">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : existingId ? "Save changes" : "Create"}</Button>
      </div>
    </form>
  );
}
