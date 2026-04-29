export const dynamic = "force-dynamic";

import Link from "next/link";
import { eventTypes } from "@/lib/collections";
import { Button } from "@/components/ui/button";
import { EventTypeCard } from "@/components/admin/EventTypeCard";
import { env } from "@/lib/env";
import { Plus } from "lucide-react";

export default async function EventTypesPage() {
  const list = await (await eventTypes()).find().sort({ position: 1 }).toArray();
  return (
    <div className="space-y-7">
      <header className="flex items-end justify-between border-b border-[--border] pb-5">
        <div>
          <h1 className="text-2xl">Event types</h1>
          <p className="text-[--ink-muted] text-sm mt-1">
            The meetings people can book with you.
          </p>
        </div>
        <Button nativeButton={false} size="sm" render={<Link href="/event-types/new" />}>
          <Plus size={14} className="mr-1.5" /> New event type
        </Button>
      </header>
      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[--border] py-14 text-center">
          <p className="text-[--ink-muted] text-sm">No event types yet.</p>
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            className="mt-4"
            render={<Link href="/event-types/new" />}
          >
            <Plus size={14} className="mr-1.5" /> Create your first
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((e) => (
            <EventTypeCard
              key={e._id.toString()}
              id={e._id.toString()}
              slug={e.slug}
              title={e.title}
              duration={e.durationMinutes}
              color={e.color}
              active={e.active}
              description={e.description}
              appUrl={env().APP_URL}
            />
          ))}
        </div>
      )}
    </div>
  );
}
