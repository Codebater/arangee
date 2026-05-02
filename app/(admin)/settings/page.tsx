export const dynamic = "force-dynamic";

import { integrations } from "@/lib/collections";
import { requireUser } from "@/lib/auth-helpers";
import { listCalendars } from "@/lib/calendar";
import { GoogleSection } from "@/components/admin/SettingsSections";
import { AppearanceSection } from "@/components/admin/AppearanceSection";

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:gap-10">
      <div>
        <h2 className="text-[14px] font-medium tracking-[-0.005em] text-ink">{title}</h2>
        {description && (
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const { user } = await requireUser();
  const integ = await (await integrations()).findOne({
    userId: user._id,
    provider: "google_calendar",
  });
  let cals: Array<{ id: string; summary: string; primary: boolean }> = [];
  let calError: string | null = null;
  if (integ?.status === "ACTIVE") {
    try {
      cals = await listCalendars(user._id.toString());
      if (cals.length === 0) {
        calError =
          "Connected, but no calendars were returned. Check the dev terminal for the raw response.";
      }
    } catch (err) {
      calError = err instanceof Error ? err.message : "Could not load calendars.";
      console.error("[settings] listCalendars failed:", err);
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          App
        </p>
        <h1 className="text-[28px] leading-tight tracking-[-0.02em]">Settings</h1>
        <p className="max-w-2xl text-[13px] text-ink-soft">
          Looking for your profile, branding, links, or badges? They&apos;re on the{" "}
          <a href="/account" className="text-ink underline-offset-4 hover:underline">
            Account page
          </a>
          .
        </p>
      </header>

      <SettingsCard
        title="Appearance"
        description="Choose how WeSchedule looks to you. System matches your OS preference."
      >
        <AppearanceSection />
      </SettingsCard>

      <div className="border-t border-border" />

      <SettingsCard
        title="Google Calendar"
        description="Source of truth for availability and where bookings are written."
      >
        <GoogleSection
          status={integ?.status ?? null}
          calendars={cals}
          selectedId={integ?.calendarId ?? null}
          error={calError}
        />
      </SettingsCard>
    </div>
  );
}
