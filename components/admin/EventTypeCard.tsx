"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toggleActive, deleteEventType } from "@/server-actions/event-types";
import { Copy, Pencil, Trash2 } from "lucide-react";

const colorMap: Record<string, string> = {
  iris: "var(--color-event-iris)",
  rose: "var(--color-event-rose)",
  amber: "var(--color-event-amber)",
  sage: "var(--color-event-sage)",
  slate: "var(--color-event-slate)",
};

interface Props {
  id: string;
  slug: string;
  title: string;
  duration: number;
  color: string;
  active: boolean;
  description: string;
  appUrl: string;
}

export function EventTypeCard({ id, slug, title, duration, color, active, description, appUrl }: Props) {
  const [pending, start] = useTransition();
  const link = `${appUrl}/${slug}`;

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5 flex flex-col gap-4">
      <div className="h-1 w-12 rounded-full" style={{ background: colorMap[color] }} />
      <div>
        <h3 className="font-display text-xl">{title}</h3>
        <p className="text-xs font-mono text-[--color-ink-muted] mt-1">{duration} min · /{slug}</p>
      </div>
      <p className="text-sm text-[--color-ink-soft] line-clamp-2">{description}</p>
      <div className="flex items-center justify-between pt-2 border-t border-[--color-border]">
        <div className="flex items-center gap-2">
          <Switch
            checked={active}
            onCheckedChange={(checked) => start(() => toggleActive(id, checked))}
            aria-label="Active"
            disabled={pending}
          />
          <span className="text-xs text-[--color-ink-muted]">{active ? "Active" : "Hidden"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(link)} title="Copy link">
            <Copy size={16} />
          </Button>
          <Button variant="ghost" size="icon" title="Edit" render={<Link href={`/event-types/${id}/edit`} />}>
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            onClick={() => {
              if (confirm("Delete this event type?")) start(() => deleteEventType(id));
            }}
            disabled={pending}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
