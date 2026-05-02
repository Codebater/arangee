"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LINK_PLATFORMS } from "@/lib/link-platforms";
import { PlatformIcon } from "@/components/public/PlatformIcon";
import type { ProfileLink, LinkPlatform } from "@/lib/types";
import { saveProfileLinks } from "@/server-actions/branding";

interface Props {
  initial: ProfileLink[];
}

export function LinksEditor({ initial }: Props) {
  const [links, setLinks] = useState<ProfileLink[]>(initial);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const dirty = JSON.stringify(links) !== JSON.stringify(initial);

  function addLink() {
    setLinks((cur) => [
      ...cur,
      { id: crypto.randomUUID(), platform: "website" as LinkPlatform, url: "" },
    ]);
  }

  function patch(id: string, change: Partial<ProfileLink>) {
    setLinks((cur) => cur.map((l) => (l.id === id ? { ...l, ...change } : l)));
  }

  function remove(id: string) {
    setLinks((cur) => cur.filter((l) => l.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    setLinks((cur) => {
      const idx = cur.findIndex((l) => l.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= cur.length) return cur;
      const copy = [...cur];
      [copy[idx], copy[next]] = [copy[next]!, copy[idx]!];
      return copy;
    });
  }

  function save() {
    start(async () => {
      const payload = links.filter((l) => l.url.trim().length > 0);
      await saveProfileLinks(payload);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="space-y-3">
      {links.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-bg-elevated px-4 py-6 text-center font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
          No links yet
        </div>
      ) : (
        <ul className="space-y-2">
          {links.map((link, idx) => {
            const def = LINK_PLATFORMS.find((p) => p.id === link.platform);
            return (
              <li
                key={link.id}
                className="grid grid-cols-[auto_140px_1fr_auto] items-center gap-2 rounded-md border border-border bg-surface p-2"
              >
                <div className="flex items-center gap-1 text-ink-muted">
                  <button
                    type="button"
                    onClick={() => move(link.id, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                    className="inline-flex h-6 w-5 items-center justify-center rounded text-ink-muted disabled:opacity-30"
                  >
                    <GripVertical size={12} />
                  </button>
                </div>
                <select
                  value={link.platform}
                  onChange={(e) => patch(link.id, { platform: e.target.value as LinkPlatform })}
                  className="h-8 rounded-md border border-border bg-surface px-2 text-[12.5px] text-ink"
                >
                  {LINK_PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <PlatformIcon
                    platform={link.platform}
                    size={14}
                    className="shrink-0 text-ink-muted"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => patch(link.id, { url: e.target.value })}
                    placeholder={def?.hint ?? "https://…"}
                    className="h-8 font-mono text-[12px]"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(link.id)}
                  className="text-ink-muted hover:text-danger"
                >
                  <Trash2 size={13} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLink}
          className="gap-1.5"
          disabled={links.length >= 12}
        >
          <Plus size={13} />
          Add link
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
              <span>Save links</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
