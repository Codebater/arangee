import { AuroraCard } from "@/components/public/profile-cards/AuroraCard";
import { ConstellationCard } from "@/components/public/profile-cards/ConstellationCard";
import { RibbonsCard } from "@/components/public/profile-cards/RibbonsCard";
import { SynthwaveCard } from "@/components/public/profile-cards/SynthwaveCard";

export type ProfileCardId = "aurora" | "constellation" | "ribbons" | "synthwave";

export const PROFILE_CARDS: ReadonlyArray<{
  id: ProfileCardId;
  label: string;
  description: string;
  Component: () => React.ReactElement;
}> = [
  {
    id: "aurora",
    label: "Aurora",
    description: "Soft purple-and-rose gradient blobs, slow drift.",
    Component: AuroraCard,
  },
  {
    id: "constellation",
    label: "Constellation",
    description: "Twinkling stars on a deep nebula.",
    Component: ConstellationCard,
  },
  {
    id: "ribbons",
    label: "Ribbons",
    description: "Three neon ribbons drifting across a dark canvas.",
    Component: RibbonsCard,
  },
  {
    id: "synthwave",
    label: "Synthwave",
    description: "Retro neon grid + setting sun.",
    Component: SynthwaveCard,
  },
];

export const PROFILE_CARD_IDS = PROFILE_CARDS.map((c) => c.id);

export function isProfileCardId(s: string): s is ProfileCardId {
  return (PROFILE_CARD_IDS as string[]).includes(s);
}

export function getProfileCard(id: string): (() => React.ReactElement) | null {
  const found = PROFILE_CARDS.find((c) => c.id === id);
  return found?.Component ?? null;
}
