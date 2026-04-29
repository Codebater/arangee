"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProfile } from "@/server-actions/settings";
import { startGoogleConnect, setActiveCalendar, disconnectGoogle } from "@/server-actions/integrations";

export function ProfileSection({ name, bio, tz }: { name: string; bio: string | null; tz: string }) {
  const [pending, start] = useTransition();
  return (
    <form action={(fd) => start(() => saveProfile(fd))} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div className="space-y-2"><Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={bio ?? ""} rows={2} />
      </div>
      <div className="space-y-2"><Label htmlFor="defaultTimezone">Default timezone</Label>
        <Input id="defaultTimezone" name="defaultTimezone" defaultValue={tz} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}

export function GoogleSection({
  status,
  calendars,
  selectedId,
}: {
  status: string | null;
  calendars: Array<{ id: string; summary: string; primary: boolean }>;
  selectedId: string | null;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wide rounded-full px-2 py-1 bg-[--color-primary-tint] text-[--color-primary]">
          {status ?? "Not connected"}
        </span>
      </div>
      {status !== "ACTIVE" ? (
        <form action={() => start(() => startGoogleConnect())}>
          <Button type="submit" disabled={pending}>{pending ? "Redirecting..." : "Connect Google Calendar"}</Button>
        </form>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Active calendar</Label>
            <select
              defaultValue={selectedId ?? ""}
              onChange={(e) => {
                const cal = calendars.find((c) => c.id === e.target.value);
                if (cal) start(() => setActiveCalendar(cal.id, cal.summary));
              }}
              className="h-9 w-full rounded-md border border-[--color-border] bg-[--color-surface] px-3 text-sm"
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>{c.summary}{c.primary ? " (primary)" : ""}</option>
              ))}
            </select>
          </div>
          <form action={() => start(() => disconnectGoogle())}>
            <Button type="submit" variant="outline">Disconnect</Button>
          </form>
        </>
      )}
    </div>
  );
}
