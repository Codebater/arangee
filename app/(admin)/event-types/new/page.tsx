import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventTypeForm } from "@/components/admin/EventTypeForm";

export default function NewEventType() {
  return (
    <div className="space-y-7">
      <Link
        href="/event-types"
        className="inline-flex items-center gap-1 text-[12px] text-[--ink-muted] hover:text-[--ink] transition-colors duration-150"
      >
        <ArrowLeft size={13} /> All event types
      </Link>
      <header className="border-b border-[--border] pb-5">
        <h1 className="text-2xl">New event type</h1>
        <p className="text-[--ink-muted] text-sm mt-1">A new way for people to book time with you.</p>
      </header>
      <EventTypeForm />
    </div>
  );
}
