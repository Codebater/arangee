"use client";

import { useState, useTransition } from "react";
import { Heart, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TierBadge } from "@/components/public/TierBadge";

const PRESETS = [500, 1000, 2500, 5000];
const SUPPORTER_THRESHOLD_CENTS = 500;
const KING_THRESHOLD_CENTS = 2500;

interface Props {
  totalCents: number;
  currency: string;
  banner?: "success" | "cancelled" | null;
}

export function SupportSection({ totalCents, currency, banner }: Props) {
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [pending, start] = useTransition();

  function donate(amountCents: number) {
    if (amountCents < 100) {
      setError("Minimum is €1.");
      return;
    }
    setError(null);
    setPendingAmount(amountCents);
    start(async () => {
      const res = await fetch("/api/billing/donate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountCents, currency: "EUR" }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error || "Could not start donation.");
        setPendingAmount(null);
        return;
      }
      const j = (await res.json()) as { url: string };
      window.location.href = j.url;
    });
  }

  const supporterUnlocked = totalCents >= SUPPORTER_THRESHOLD_CENTS;
  const kingUnlocked = totalCents >= KING_THRESHOLD_CENTS;

  return (
    <div className="space-y-4 max-w-2xl">
      {banner === "success" && (
        <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12.5px] text-ink">
          Thanks for your support! Your badge is unlocked once Stripe confirms the payment (a few seconds).
        </p>
      )}
      {banner === "cancelled" && (
        <p className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-[12.5px] text-ink-muted">
          Donation cancelled. No charge.
        </p>
      )}

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/15 text-pink-500">
            <Heart size={16} />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              Lifetime donations
            </p>
            <p className="text-[18px] font-medium tracking-[-0.01em]">
              {formatAmount(totalCents, currency)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <BadgeStatus
            type="supporter"
            unlocked={supporterUnlocked}
            requirement={`€${SUPPORTER_THRESHOLD_CENTS / 100}+`}
          />
          <BadgeStatus
            type="king"
            unlocked={kingUnlocked}
            requirement={`€${KING_THRESHOLD_CENTS / 100}+`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {PRESETS.map((cents) => {
            const loading = pending && pendingAmount === cents;
            return (
              <Button
                key={cents}
                type="button"
                variant="outline"
                onClick={() => donate(cents)}
                disabled={pending}
                className="gap-1.5"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Heart size={13} />}
                <span>€{cents / 100}</span>
              </Button>
            );
          })}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const cents = Math.round(Number(custom) * 100);
            if (Number.isFinite(cents)) donate(cents);
          }}
          className="flex items-center gap-2"
        >
          <span className="font-mono text-[12px] text-ink-muted">€</span>
          <Input
            type="number"
            step="0.01"
            min="1"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Custom amount"
            className="h-9 max-w-[160px] font-mono tabular"
          />
          <Button type="submit" variant="outline" disabled={pending || !custom} className="gap-1.5">
            {pending && pendingAmount && !PRESETS.includes(pendingAmount) ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Heart size={13} />
            )}
            <span>Donate</span>
          </Button>
        </form>
        {error && <p className="text-[12px] text-danger">{error}</p>}
        <p className="text-[11.5px] text-ink-muted">
          One-time. Cosmetic only — donations don&apos;t grant Pro features. Powered by Stripe.
        </p>
      </div>
    </div>
  );
}

function BadgeStatus({
  type,
  unlocked,
  requirement,
}: {
  type: "supporter" | "king";
  unlocked: boolean;
  requirement: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
        unlocked
          ? "border-primary/30 bg-primary-tint/40"
          : "border-border bg-bg-elevated opacity-60"
      }`}
    >
      <span className={unlocked ? "" : "grayscale"}>
        {type === "king" ? (
          <Crown size={16} className="text-amber-500" />
        ) : (
          <TierBadge type={type} size={20} />
        )}
      </span>
      <div className="leading-tight">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink">
          {type === "supporter" ? "Supporter" : "King"}
        </p>
        <p className="font-mono text-[10px] text-ink-muted">
          {unlocked ? "Unlocked" : `Donate ${requirement}`}
        </p>
      </div>
    </div>
  );
}

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
