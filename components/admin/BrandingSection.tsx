"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { ThemeBuilder } from "./ThemeBuilder";

interface Props {
  username: string;
  avatarImageId: string | null;
  bannerImageId: string | null;
  themeTokensLight: Record<string, string>;
  themeTokensDark: Record<string, string>;
}

export function BrandingSection({
  username,
  avatarImageId,
  bannerImageId,
  themeTokensLight,
  themeTokensDark,
}: Props) {
  const [themeOpen, setThemeOpen] = useState(false);
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Banner
        </p>
        <ImageUploader kind="banner" currentImageId={bannerImageId} />
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Avatar
        </p>
        <ImageUploader kind="avatar" currentImageId={avatarImageId} />
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
