export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
    <div className="space-y-7">
      <Link
        href="/event-types"
        className="inline-flex items-center gap-1 text-[12px] text-[--ink-muted] hover:text-[--ink] transition-colors duration-150"
      >
        <ArrowLeft size={13} /> All event types
      </Link>
      <header className="border-b border-[--border] pb-5">
        <h1 className="text-2xl">Edit event type</h1>
        <p className="text-[--ink-muted] text-sm mt-1 font-mono">/{evt.slug}</p>
      </header>
      <EventTypeForm existingId={id} initial={initial} />
    </div>
  );
}
