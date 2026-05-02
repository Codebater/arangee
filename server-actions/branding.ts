"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { users } from "@/lib/collections";
import {
  brandingFormSchema,
  fontChoiceSchema,
  profileCardSchema,
  profileLinksSchema,
  profileBadgesSchema,
} from "@/lib/validation";
import { removeImageForUser } from "@/lib/images";
import { ALLOWED_TOKEN_KEYS, COLOR_VALUE_RE } from "@/lib/theme-tokens";
import { isValidLinkUrl, normalizeLinkUrl } from "@/lib/link-platforms";

function sanitizeTokens(map: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!map) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    if (!ALLOWED_TOKEN_KEYS.has(k)) continue;
    if (!COLOR_VALUE_RE.test(v)) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function saveBrandingTokens(payload: unknown) {
  const { user } = await requireUser();
  const parsed = brandingFormSchema.parse(payload);
  const light = sanitizeTokens(parsed.themeTokensLight);
  const dark = sanitizeTokens(parsed.themeTokensDark);

  const update: Record<string, unknown> = { updatedAt: new Date() };
  const unset: Record<string, "" > = {};
  if (light) update["branding.themeTokensLight"] = light;
  else unset["branding.themeTokensLight"] = "";
  if (dark) update["branding.themeTokensDark"] = dark;
  else unset["branding.themeTokensDark"] = "";

  await (await users()).updateOne(
    { _id: user._id },
    Object.keys(unset).length
      ? { $set: update, $unset: unset }
      : { $set: update },
  );
  revalidatePath("/settings");
  revalidatePath(`/${user.username}`);
}

export async function deleteBrandingImage(kind: "avatar" | "banner") {
  const { user } = await requireUser();
  await removeImageForUser(user, kind);
  revalidatePath("/settings");
  revalidatePath(`/${user.username}`);
}

export async function saveFont(value: string | null) {
  const { user } = await requireUser();
  if (value === null || value === "") {
    await (await users()).updateOne(
      { _id: user._id },
      { $unset: { "branding.font": "" }, $set: { updatedAt: new Date() } },
    );
  } else {
    const parsed = fontChoiceSchema.parse(value);
    await (await users()).updateOne(
      { _id: user._id },
      { $set: { "branding.font": parsed, updatedAt: new Date() } },
    );
  }
  revalidatePath("/settings");
  revalidatePath(`/${user.username}`);
}

export async function saveProfileLinks(payload: unknown) {
  const { user } = await requireUser();
  const parsed = profileLinksSchema.parse(payload);
  const cleaned = parsed
    .map((link) => {
      const url = normalizeLinkUrl(link.platform, link.url);
      if (!isValidLinkUrl(link.platform, url)) return null;
      return { ...link, url };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  await (await users()).updateOne(
    { _id: user._id },
    cleaned.length
      ? { $set: { links: cleaned, updatedAt: new Date() } }
      : { $unset: { links: "" }, $set: { updatedAt: new Date() } },
  );
  revalidatePath("/account");
  revalidatePath(`/${user.username}`);
}

export async function saveProfileBadges(payload: unknown) {
  const { user } = await requireUser();
  const parsed = profileBadgesSchema.parse(payload);
  await (await users()).updateOne(
    { _id: user._id },
    parsed.length
      ? { $set: { badges: parsed, updatedAt: new Date() } }
      : { $unset: { badges: "" }, $set: { updatedAt: new Date() } },
  );
  revalidatePath("/account");
  revalidatePath(`/${user.username}`);
}

export async function saveProfileCard(payload: unknown) {
  const { user } = await requireUser();
  if (payload === null || payload === undefined) {
    await (await users()).updateOne(
      { _id: user._id },
      { $unset: { "branding.profileCard": "" }, $set: { updatedAt: new Date() } },
    );
  } else {
    const parsed = profileCardSchema.parse(payload);
    await (await users()).updateOne(
      { _id: user._id },
      { $set: { "branding.profileCard": parsed, updatedAt: new Date() } },
    );
  }
  revalidatePath("/settings");
  revalidatePath(`/${user.username}`);
}
