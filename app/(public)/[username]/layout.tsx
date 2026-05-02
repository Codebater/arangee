import { notFound } from "next/navigation";
import { findUserByUsername } from "@/lib/scope";
import { isReservedUsername } from "@/lib/users";
import { buildThemeOverrideCSS } from "@/lib/theme-tokens";
import { PUBLIC_FONT_VARIABLES, fontFamilyFor, isFontChoice } from "@/lib/fonts";

export default async function UsernameLayout({
  params,
  children,
}: {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}) {
  const { username } = await params;
  if (isReservedUsername(username)) notFound();
  const user = await findUserByUsername(username);
  if (!user) notFound();

  const css = buildThemeOverrideCSS(
    user.branding?.themeTokensLight,
    user.branding?.themeTokensDark,
  );
  const fontKey = user.branding?.font;
  const fontFamily = fontKey && isFontChoice(fontKey) ? fontFamilyFor(fontKey) : undefined;

  return (
    <div className={PUBLIC_FONT_VARIABLES} style={fontFamily ? { fontFamily } : undefined}>
      {css && (
        <style
          // CSS values are constrained to COLOR_VALUE_RE before this runs.
          dangerouslySetInnerHTML={{ __html: css }}
        />
      )}
      {children}
    </div>
  );
}
