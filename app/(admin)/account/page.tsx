export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { ProfileSection } from "@/components/admin/SettingsSections";
import { BrandingSection } from "@/components/admin/BrandingSection";
import { LinksEditor } from "@/components/admin/LinksEditor";
import { BadgesEditor } from "@/components/admin/BadgesEditor";
import { TierBadgesEditor } from "@/components/admin/TierBadgesEditor";

function Section({
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

export default async function AccountPage() {
  const { user } = await requireUser();
  const profileCardId =
    (user.branding?.profileCard?.template as
      | "aurora"
      | "constellation"
      | "ribbons"
      | "synthwave"
      | undefined) ?? null;

  return (
    <div className="space-y-10">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Account
        </p>
        <h1 className="text-[28px] leading-tight tracking-[-0.02em]">Your profile</h1>
        <p className="max-w-2xl text-[13px] text-ink-soft">
          Everything that shows up at{" "}
          <Link
            href={`/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline-offset-4 hover:underline"
          >
            /{user.username}
          </Link>
          .
        </p>
      </header>

      <Section title="Profile" description="Your name, bio, and timezone.">
        <ProfileSection name={user.name} bio={user.bio} tz={user.defaultTimezone} />
      </Section>

      <div className="border-t border-border" />

      <Section
        title="Tier badges"
        description="Discord-style icon badges shown next to your name."
      >
        <TierBadgesEditor initial={user.tierBadges ?? []} />
      </Section>

      <div className="border-t border-border" />

      <Section title="Custom badges" description="Short text tags shown under your name.">
        <BadgesEditor initial={user.badges ?? []} />
      </Section>

      <div className="border-t border-border" />

      <Section title="Links" description="Social, GitHub, website, anywhere people can find you.">
        <LinksEditor initial={user.links ?? []} />
      </Section>

      <div className="border-t border-border" />

      <Section
        title="Branding"
        description="Avatar, banner, animated card, font, and theme tokens."
      >
        <BrandingSection
          username={user.username}
          avatarImageId={user.branding?.avatarImageId?.toString() ?? null}
          bannerImageId={user.branding?.bannerImageId?.toString() ?? null}
          themeTokensLight={user.branding?.themeTokensLight ?? {}}
          themeTokensDark={user.branding?.themeTokensDark ?? {}}
          profileCard={profileCardId}
          font={user.branding?.font ?? null}
        />
      </Section>

      <div className="border-t border-border" />

      <Section title="Identifier" description="Sign-in email and public username.">
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
      </Section>
    </div>
  );
}
