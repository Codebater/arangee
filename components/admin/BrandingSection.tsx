"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { ThemeBuilder } from "./ThemeBuilder";
import { ProfileCardPicker } from "./ProfileCardPicker";
import { FontPicker } from "./FontPicker";
import { BookedSlotsToggle } from "./BookedSlotsToggle";
import type { ProfileCardId } from "@/lib/profile-cards";
import type { FontChoice } from "@/lib/fonts";

interface Props {
  username: string;
  avatarImageId: string | null;
  bannerImageId: string | null;
  themeTokensLight: Record<string, string>;
  themeTokensDark: Record<string, string>;
  profileCard: ProfileCardId | null;
  font: FontChoice | null;
  allowAvatarGif?: boolean;
  allowBannerGif?: boolean;
  hideBookedSlots?: boolean;
}

export function BrandingSection({
  username,
  avatarImageId,
  bannerImageId,
  themeTokensLight,
  themeTokensDark,
  profileCard,
  font,
  allowAvatarGif = true,
  allowBannerGif = true,
  hideBookedSlots = false,
}: Props) {
  const [themeOpen, setThemeOpen] = useState(false);
  return (
    <div className="space-y-7 max-w-2xl">
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Banner
        </p>
        <ImageUploader
          kind="banner"
          currentImageId={bannerImageId}
          allowGif={allowBannerGif}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Avatar
        </p>
        <ImageUploader
          kind="avatar"
          currentImageId={avatarImageId}
          allowGif={allowAvatarGif}
        />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Animated card
        </p>
        <ProfileCardPicker current={profileCard} />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Public font
        </p>
        <FontPicker current={font} />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Public availability
        </p>
        <BookedSlotsToggle initialHidden={hideBookedSlots} />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Public profile
        </p>
        <a
          href={`/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink underline-offset-4 hover:underline"
        >
          /{username} →
        </a>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setThemeOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted transition-colors duration-150 hover:text-ink"
        >
          <ChevronDown
            size={12}
            className={`transition-transform duration-150 ${themeOpen ? "rotate-0" : "-rotate-90"}`}
          />
          Theme tokens
        </button>
        {themeOpen && (
          <div className="rounded-lg border border-border bg-bg-elevated p-4">
            <ThemeBuilder
              initialLight={themeTokensLight}
              initialDark={themeTokensDark}
            />
          </div>
        )}
      </div>
    </div>
  );
}
