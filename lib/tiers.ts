import type { TierBadgeType, UserDoc } from "./types";

export type Plan = "free" | "pro";

export interface TierLimits {
  eventTypes: number;
  bannerGif: boolean;
  avatarGif: boolean;
  customBadges: boolean;
  tierBadgesAllowed: TierBadgeType[];
  animatedProfileCard: boolean;
  themeBuilder: boolean;
  paymentsAllowed: boolean;
}

export const TIER_LIMITS: Record<Plan, TierLimits> = {
  free: {
    eventTypes: 3,
    bannerGif: false,
    avatarGif: true,
    customBadges: true,
    tierBadgesAllowed: ["free"],
    animatedProfileCard: true,
    themeBuilder: true,
    paymentsAllowed: false,
  },
  pro: {
    eventTypes: Number.POSITIVE_INFINITY,
    bannerGif: true,
    avatarGif: true,
    customBadges: true,
    tierBadgesAllowed: ["free", "pro", "developer"],
    animatedProfileCard: true,
    themeBuilder: true,
    paymentsAllowed: true,
  },
};

export const SUPPORTER_THRESHOLD_CENTS = 500;
export const KING_THRESHOLD_CENTS = 2500;

export function isPlanActive(user: UserDoc): Plan {
  if (user.plan !== "pro") return "free";
  const status = user.subscription?.status;
  if (!status) return "pro";
  if (status === "active" || status === "trialing" || status === "past_due") return "pro";
  return "free";
}

export function getEntitledTierBadges(user: UserDoc): TierBadgeType[] {
  const plan = isPlanActive(user);
  const base = [...TIER_LIMITS[plan].tierBadgesAllowed];
  const total = user.donations?.totalCents ?? 0;
  if (total >= SUPPORTER_THRESHOLD_CENTS) base.push("supporter");
  if (total >= KING_THRESHOLD_CENTS) base.push("king");
  return Array.from(new Set(base));
}

export function eventTypeLimitFor(user: UserDoc): number {
  return TIER_LIMITS[isPlanActive(user)].eventTypes;
}

export function canUploadGif(user: UserDoc, kind: "avatar" | "banner"): boolean {
  const limits = TIER_LIMITS[isPlanActive(user)];
  return kind === "avatar" ? limits.avatarGif : limits.bannerGif;
}

export function canUsePayments(user: UserDoc): boolean {
  return TIER_LIMITS[isPlanActive(user)].paymentsAllowed;
}
