export const dynamic = "force-dynamic";

import { ObjectId } from "mongodb";
import { users, integrations } from "@/lib/collections";
import { requireAdmin } from "@/lib/auth-helpers";
import { listCalendars } from "@/lib/calendar";
import { ProfileSection, GoogleSection } from "@/components/admin/SettingsSections";

export default async function SettingsPage() {
  const session = await requireAdmin();
  const user = await (await users()).findOne({ _id: new ObjectId(session.user.id) });
  if (!user) throw new Error("User missing");
  const integ = await (await integrations()).findOne({
    userId: user._id,
    provider: "google_calendar",
  });
  let cals: Array<{ id: string; summary: string; primary: boolean }> = [];
  if (integ?.status === "ACTIVE") {
    try {
      cals = await listCalendars(session.user.id);
    } catch {
      cals = [];
    }
  }

  return (
    <div className="space-y-7">
      <header className="flex items-end justify-between border-b border-[--border] pb-5">
        <div>
          <h1 className="text-2xl">Settings</h1>
          <p className="text-[--ink-muted] text-sm mt-1">Manage your account and integrations.</p>
        </div>
      </header>

      <section className="rounded-lg border border-[--border] bg-[--surface] p-5">
        <div className="mb-4">
          <h2 className="text-base">Profile</h2>
          <p className="text-[12px] text-[--ink-muted] mt-0.5">
            Public name and timezone shown on your booking pages.
          </p>
        </div>
        <ProfileSection name={user.name} bio={user.bio} tz={user.defaultTimezone} />
      </section>

      <section className="rounded-lg border border-[--border] bg-[--surface] p-5">
        <div className="mb-4">
          <h2 className="text-base">Google Calendar</h2>
          <p className="text-[12px] text-[--ink-muted] mt-0.5">
            Source of truth for availability and where bookings are written.
          </p>
        </div>
        <GoogleSection
          status={integ?.status ?? null}
          calendars={cals}
          selectedId={integ?.calendarId ?? null}
        />
      </section>

      <section className="rounded-lg border border-[--border] bg-[--surface] p-5">
        <div className="mb-2">
          <h2 className="text-base">Password</h2>
        </div>
        <p className="text-[13px] text-[--ink-soft] leading-relaxed">
          Edit <code className="font-mono text-[--ink] bg-[--surface-hover] px-1 py-0.5 rounded">ADMIN_PASSWORD</code> in{" "}
          <code className="font-mono text-[--ink] bg-[--surface-hover] px-1 py-0.5 rounded">.env.local</code> and restart the dev server.
        </p>
      </section>
    </div>
  );
}
