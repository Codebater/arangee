import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { EventTypeForm } from "@/components/admin/EventTypeForm";
import { eventTypes } from "@/lib/collections";

export default async function EditEventType({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const evt = await (await eventTypes()).findOne({ _id: new ObjectId(id) });
  if (!evt) notFound();

  const initial = {
    slug: evt.slug,
    title: evt.title,
    description: evt.description,
    durationMinutes: evt.durationMinutes,
    color: evt.color,
    location: evt.location,
    rules: evt.rules,
    customQuestions: evt.customQuestions,
    active: evt.active,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display">Edit event type</h1>
      </header>
      <EventTypeForm existingId={id} initial={initial} />
    </div>
  );
}
