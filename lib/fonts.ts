import { Geist, Inter, Manrope, IBM_Plex_Sans } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-public-geist", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-public-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-public-manrope", display: "swap" });
const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-public-ibm-plex",
  display: "swap",
});

export const PUBLIC_FONT_VARIABLES = `${geist.variable} ${inter.variable} ${manrope.variable} ${ibmPlex.variable}`;

export type FontChoice = "geist" | "inter" | "manrope" | "ibm-plex";

export const PUBLIC_FONT_OPTIONS: ReadonlyArray<{
  id: FontChoice;
  label: string;
  description: string;
}> = [
  { id: "geist", label: "Geist", description: "Clean and neutral (default)." },
  { id: "inter", label: "Inter", description: "Slightly tighter, very legible." },
  { id: "manrope", label: "Manrope", description: "Warmer, rounded geometric." },
  { id: "ibm-plex", label: "IBM Plex Sans", description: "Engineering / editorial feel." },
];

const FONT_FAMILY: Record<FontChoice, string> = {
  geist: "var(--font-public-geist), ui-sans-serif, system-ui, sans-serif",
  inter: "var(--font-public-inter), ui-sans-serif, system-ui, sans-serif",
  manrope: "var(--font-public-manrope), ui-sans-serif, system-ui, sans-serif",
  "ibm-plex": "var(--font-public-ibm-plex), ui-sans-serif, system-ui, sans-serif",
};

export function fontFamilyFor(choice: FontChoice | undefined | null): string | undefined {
  if (!choice) return undefined;
  return FONT_FAMILY[choice];
}

export function isFontChoice(s: string): s is FontChoice {
  return ["geist", "inter", "manrope", "ibm-plex"].includes(s);
}
