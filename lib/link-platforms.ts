import type { LinkPlatform } from "./types";

export interface LinkPlatformDef {
  id: LinkPlatform;
  label: string;
  hint: string;
  prefix?: string;
}

export const LINK_PLATFORMS: ReadonlyArray<LinkPlatformDef> = [
  { id: "website", label: "Website", hint: "https://yoursite.com" },
  { id: "email", label: "Email", hint: "you@example.com", prefix: "mailto:" },
  { id: "github", label: "GitHub", hint: "https://github.com/handle" },
  { id: "twitter", label: "X / Twitter", hint: "https://x.com/handle" },
  { id: "linkedin", label: "LinkedIn", hint: "https://linkedin.com/in/handle" },
  { id: "instagram", label: "Instagram", hint: "https://instagram.com/handle" },
  { id: "youtube", label: "YouTube", hint: "https://youtube.com/@handle" },
  { id: "twitch", label: "Twitch", hint: "https://twitch.tv/handle" },
  { id: "tiktok", label: "TikTok", hint: "https://tiktok.com/@handle" },
  { id: "discord", label: "Discord", hint: "https://discord.gg/invite" },
  { id: "telegram", label: "Telegram", hint: "https://t.me/handle" },
  { id: "mastodon", label: "Mastodon", hint: "https://mastodon.social/@handle" },
  { id: "bluesky", label: "Bluesky", hint: "https://bsky.app/profile/handle" },
  { id: "custom", label: "Other", hint: "https://…" },
];

export function findPlatform(id: LinkPlatform): LinkPlatformDef {
  return LINK_PLATFORMS.find((p) => p.id === id) ?? LINK_PLATFORMS[LINK_PLATFORMS.length - 1]!;
}

export function normalizeLinkUrl(platform: LinkPlatform, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (platform === "email") {
    return trimmed.startsWith("mailto:") ? trimmed : `mailto:${trimmed}`;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const URL_RE = /^https?:\/\/.+/i;
const EMAIL_RE = /^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i;

export function isValidLinkUrl(platform: LinkPlatform, url: string): boolean {
  if (platform === "email") return EMAIL_RE.test(url);
  return URL_RE.test(url);
}
