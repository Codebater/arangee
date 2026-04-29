"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toggleActive, deleteEventType } from "@/server-actions/event-types";
import { Copy, Pencil, Trash2 } from "lucide-react";

const colorMap: Record<string, string> = {
  iris: "var(--event-iris)",
  rose: "var(--event-rose)",
  amber: "var(--event-amber)",
  sage: "var(--event-sage)",
  slate: "var(--event-slate)",
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

export function EventTypeCard({
  id,
  slug,
  title,
  duration,
  color,
  active,
  description,
  appUrl,
}: Props) {
  const [pending, start] = useTransition();
  const link = `${appUrl}/${slug}`;

  return (
    <div className="group relative rounded-lg border border-[--border] bg-[--surface] overflow-hidden transition-colors duration-150 hover:border-[--border-strong]">
      <div className="h-[2px] w-full" style={{ background: colorMap[color] }} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[--ink] truncate">{title}</h3>
            <p className="text-[11px] font-mono text-[--ink-muted] mt-0.5">
              {duration}m · /{slug}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Switch
              checked={active}
              onCheckedChange={(checked) => start(() => toggleActive(id, checked))}
              aria-label="Active"
              disabled={pending}
            />
          </div>
        </div>
        {description && (
          <p className="text-[13px] text-[--ink-soft] line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-[--border]">
          <span className="text-[11px] uppercase tracking-[0.08em] text-[--ink-muted]">
            {active ? "Active" : "Hidden"}
          </span>
          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-150">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigator.clipboard.writeText(link)}
              title="Copy link"
            >
              <Copy size={13} />
            </Button>
            <Button
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              title="Edit"
              render={<Link href={`/event-types/${id}/edit`} />}
            >
              <Pencil size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Delete"
              onClick={() => {
                if (confirm("Delete this event type?")) start(() => deleteEventType(id));
              }}
              disabled={pending}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
