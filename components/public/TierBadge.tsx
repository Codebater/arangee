"use client";

import { motion } from "framer-motion";
import { Crown, Gem, Heart, Code2, CircleUser } from "lucide-react";
import type { TierBadgeType } from "@/lib/types";

interface TierDef {
  label: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  className: string;
  glow?: boolean;
}

const TIERS: Record<TierBadgeType, TierDef> = {
  free: {
    label: "Free",
    description: "Free account",
    Icon: CircleUser,
    className: "bg-slate-500/15 text-slate-500 dark:bg-slate-400/15 dark:text-slate-300",
  },
  pro: {
    label: "Pro",
    description: "Pro member",
    Icon: Gem,
    className: "bg-cyan-500/15 text-cyan-500 dark:bg-cyan-400/15 dark:text-cyan-300",
    glow: true,
  },
  king: {
    label: "King",
    description: "VIP",
    Icon: Crown,
    className:
      "bg-gradient-to-br from-amber-300/30 to-amber-500/25 text-amber-500 dark:text-amber-300",
    glow: true,
  },
  supporter: {
    label: "Supporter",
    description: "Community supporter",
    Icon: Heart,
    className: "bg-pink-500/15 text-pink-500 dark:bg-pink-400/15 dark:text-pink-300",
  },
  developer: {
    label: "Developer",
    description: "Developer",
    Icon: Code2,
    className: "bg-blue-500/15 text-blue-500 dark:bg-blue-400/15 dark:text-blue-300",
  },
};

export function TierBadge({ type, size = 22 }: { type: TierBadgeType; size?: number }) {
  const def = TIERS[type];
  const Icon = def.Icon;
  return (
    <motion.span
      whileHover={{ scale: 1.15 }}
      animate={
        def.glow
          ? {
              boxShadow: [
                "0 0 0 0 currentColor",
                "0 0 10px 1px currentColor",
                "0 0 0 0 currentColor",
              ],
            }
          : undefined
      }
      transition={
        def.glow
          ? {
              default: { type: "spring", stiffness: 380, damping: 18 },
              boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
            }
          : { type: "spring", stiffness: 380, damping: 18 }
      }
      style={{ willChange: def.glow ? "transform, box-shadow" : "transform" }}
      tabIndex={0}
      role="img"
      aria-label={def.description}
      title={def.description}
      className={`group relative inline-flex shrink-0 items-center justify-center rounded-md outline-none ${def.className}`}
    >
      <span className="flex items-center justify-center" style={{ width: size, height: size }}>
        <Icon size={Math.round(size * 0.62)} strokeWidth={2.2} />
      </span>
      <TierTooltip label={def.label} />
    </motion.span>
  );
}

function TierTooltip({ label }: { label: string }) {
  return (
    <span
      className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-bg opacity-0 shadow-[var(--shadow-modal)] transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
      role="tooltip"
    >
      {label}
    </span>
  );
}

export function TierBadges({
  badges,
  size = 22,
}: {
  badges: TierBadgeType[] | undefined;
  size?: number;
}) {
  if (!badges?.length) return null;
  // Dedupe + preserve canonical order (free, pro, king, supporter, developer).
  const order: TierBadgeType[] = ["free", "pro", "king", "supporter", "developer"];
  const set = new Set(badges);
  const ordered = order.filter((t) => set.has(t));
  return (
    <span className="inline-flex items-center gap-1.5">
      {ordered.map((t) => (
        <TierBadge key={t} type={t} size={size} />
      ))}
    </span>
  );
}

export const TIER_BADGE_DEFS = TIERS;
