import { notFound } from "next/navigation";
import { findUserByUsername } from "@/lib/scope";
import { isReservedUsername } from "@/lib/users";
import { buildThemeOverrideCSS } from "@/lib/theme-tokens";

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

  return (
    <>
      {css && (
        <style
          // The CSS string only contains values that pass COLOR_VALUE_RE,
          // so it can't escape the <style> context.
          dangerouslySetInnerHTML={{ __html: css }}
        />
      )}
      {children}
    </>
  );
}
