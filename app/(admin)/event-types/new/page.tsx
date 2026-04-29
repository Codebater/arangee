import { EventTypeForm } from "@/components/admin/EventTypeForm";

export default function NewEventType() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display">New event type</h1>
      </header>
      <EventTypeForm />
    </div>
  );
}
