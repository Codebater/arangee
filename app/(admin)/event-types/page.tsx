import Link from "next/link";
import { eventTypes } from "@/lib/collections";
import { Button } from "@/components/ui/button";
import { EventTypeCard } from "@/components/admin/EventTypeCard";
import { env } from "@/lib/env";
import { Plus } from "lucide-react";

export default async function EventTypesPage() {
  const list = await (await eventTypes()).find().sort({ position: 1 }).toArray();
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display">Event types</h1>
          <p className="text-[--color-ink-muted] text-sm mt-1">The meetings people can book with you.</p>
        </div>
        <Button render={<Link href="/event-types/new" />}>
          <Plus size={16} className="mr-2" /> New event type
        </Button>
      </header>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--color-border] p-10 text-center">
          <p className="text-[--color-ink-muted] text-sm">No event types yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
