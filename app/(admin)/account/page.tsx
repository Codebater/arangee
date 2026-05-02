export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { ProfileSection } from "@/components/admin/SettingsSections";

export default async function AccountPage() {
  const { user } = await requireUser();
  return (
    <div className="space-y-10">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Account
        </p>
        <h1 className="text-[28px] leading-tight tracking-[-0.02em]">Profile</h1>
        <p className="max-w-2xl text-[13px] text-ink-soft">
          Your name, bio, and timezone — these show up on your public booking page.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:gap-10">
        <div>
          <h2 className="text-[14px] font-medium tracking-[-0.005em] text-ink">Profile</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
            Public name and timezone shown on your booking pages.
          </p>
        </div>
        <div>
          <ProfileSection name={user.name} bio={user.bio} tz={user.defaultTimezone} />
        </div>
      </section>

      <div className="border-t border-border" />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr] md:gap-10">
        <div>
          <h2 className="text-[14px] font-medium tracking-[-0.005em] text-ink">Identifier</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
            Sign-in email and public username.
          </p>
        </div>
        <div className="space-y-4 max-w-xl">
          <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
              Email
            </p>
            <p className="mt-0.5 text-[13px] text-ink">{user.email}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3.5 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
              Username
            </p>
            <p className="mt-0.5 text-[13px] text-ink">@{user.username}</p>
            <Link
              href={`/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[12px] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              View public profile <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
