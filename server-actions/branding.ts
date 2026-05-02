"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth-helpers";
import { users } from "@/lib/collections";
import { brandingFormSchema } from "@/lib/validation";
import { removeImageForUser } from "@/lib/images";
import { ALLOWED_TOKEN_KEYS, COLOR_VALUE_RE } from "@/lib/theme-tokens";

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
