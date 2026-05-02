export interface TokenGroup {
  id: string;
  title: string;
  tokens: ReadonlyArray<{ key: string; label: string }>;
}

export const TOKEN_GROUPS: ReadonlyArray<TokenGroup> = [
  {
    id: "accent",
    title: "Accent",
    tokens: [
      { key: "primary", label: "Primary" },
      { key: "primary-tint", label: "Primary tint" },
    ],
  },
  {
    id: "surface",
    title: "Surface",
    tokens: [
      { key: "bg", label: "Background" },
      { key: "surface", label: "Surface" },
      { key: "surface-hover", label: "Surface hover" },
    ],
  },
  {
    id: "ink",
    title: "Text",
    tokens: [
      { key: "ink", label: "Ink" },
      { key: "ink-soft", label: "Ink soft" },
      { key: "ink-muted", label: "Ink muted" },
    ],
  },
  {
    id: "border",
    title: "Borders",
    tokens: [
      { key: "border", label: "Border" },
      { key: "border-strong", label: "Border strong" },
    ],
  },
  {
    id: "events",
    title: "Event hues",
    tokens: [
      { key: "event-iris", label: "Iris" },
      { key: "event-rose", label: "Rose" },
      { key: "event-amber", label: "Amber" },
      { key: "event-sage", label: "Sage" },
      { key: "event-slate", label: "Slate" },
    ],
  },
] as const;

export const ALLOWED_TOKEN_KEYS: ReadonlySet<string> = new Set(
  TOKEN_GROUPS.flatMap((g) => g.tokens.map((t) => t.key)),
);

export const COLOR_VALUE_RE = /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d.,\s]+\)$/;

export function buildThemeOverrideCSS(
  light: Record<string, string> | undefined,
  dark: Record<string, string> | undefined,
): string | null {
  const lightLines = filterTokens(light);
  const darkLines = filterTokens(dark);
  if (!lightLines.length && !darkLines.length) return null;
  const parts: string[] = [];
  if (lightLines.length) parts.push(`:root{${lightLines.join("")}}`);
  if (darkLines.length) parts.push(`html.dark{${darkLines.join("")}}`);
  return parts.join("");
}

function filterTokens(map: Record<string, string> | undefined): string[] {
  if (!map) return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(map)) {
    if (!ALLOWED_TOKEN_KEYS.has(key)) continue;
    if (!COLOR_VALUE_RE.test(value)) continue;
    out.push(`--${key}:${value};`);
  }
  return out;
}
