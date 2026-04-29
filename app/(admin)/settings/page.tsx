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
  const integ = await (await integrations()).findOne({ userId: user._id, provider: "google_calendar" });
  let cals: Array<{ id: string; summary: string; primary: boolean }> = [];
  if (integ?.status === "ACTIVE") {
    try {
      cals = await listCalendars(session.user.id);
    } catch {
      cals = [];
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-display">Settings</h1>
      </header>
      <section className="space-y-4">
        <h2 className="font-display text-xl">Profile</h2>
        <ProfileSection name={user.name} bio={user.bio} tz={user.defaultTimezone} />
      </section>
      <section className="space-y-4">
        <h2 className="font-display text-xl">Google Calendar</h2>
        <GoogleSection
          status={integ?.status ?? null}
          calendars={cals}
          selectedId={integ?.calendarId ?? null}
        />
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-xl">Password</h2>
        <p className="text-sm text-[--color-ink-muted]">
          Run <code className="font-mono">npm run set-password</code> in your terminal, then paste the printed
          <code className="font-mono"> ADMIN_PASSWORD_HASH</code> into <code className="font-mono">.env.local</code> and restart.
        </p>
      </section>
    </div>
  );
}
