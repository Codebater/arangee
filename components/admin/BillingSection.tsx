"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  plan: "free" | "pro";
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
  banner?: "success" | "cancelled" | null;
}

export function BillingSection({
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  hasCustomer,
  banner,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function startCheckout() {
    setError(null);
    start(async () => {
      const res = await fetch("/api/billing/subscribe", { method: "POST" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          j.error === "stripe_not_configured"
            ? "Stripe isn't configured on this server."
            : j.error || "Could not start checkout.",
        );
        return;
      }
      const j = (await res.json()) as { url: string };
      window.location.href = j.url;
    });
  }

  return (
    <div id="billing" className="space-y-4 max-w-2xl">
      {banner === "success" && (
        <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12.5px] text-ink">
          You&apos;re Pro — thanks!
        </p>
      )}
      {banner === "cancelled" && (
        <p className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-[12.5px] text-ink-muted">
          Checkout cancelled. No changes made.
        </p>
      )}

      {plan === "pro" ? (
        <ProBlock
          status={status}
          currentPeriodEnd={currentPeriodEnd}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          hasCustomer={hasCustomer}
        />
      ) : (
        <FreeBlock pending={pending} onUpgrade={startCheckout} />
      )}

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function FreeBlock({ pending, onUpgrade }: { pending: boolean; onUpgrade: () => void }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Current plan
          </p>
          <p className="mt-1 text-[18px] font-medium tracking-[-0.01em]">Free</p>
        </div>
      </div>
      <div className="rounded-lg border border-primary/30 bg-primary-tint/40 p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-primary">
            WeSchedule Pro · €5 / month
          </p>
        </div>
        <ul className="mt-3 space-y-1.5 text-[13px] text-ink-soft">
          <FeatureRow>Unlimited event types</FeatureRow>
          <FeatureRow>Animated banner GIFs</FeatureRow>
          <FeatureRow>Pro &amp; Developer tier badges</FeatureRow>
          <FeatureRow>Charge for paid bookings (Stripe + crypto)</FeatureRow>
          <FeatureRow>Cancel anytime</FeatureRow>
        </ul>
        <Button onClick={onUpgrade} disabled={pending} className="mt-4 gap-2">
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              <span>Opening checkout…</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Upgrade to Pro</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ProBlock({
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  hasCustomer,
}: {
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary-tint/30 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
            Current plan
          </p>
          <p className="mt-1 inline-flex items-center gap-2 text-[18px] font-medium tracking-[-0.01em]">
            <Sparkles size={16} className="text-primary" />
            Pro
          </p>
        </div>
      </div>
      <dl className="space-y-1.5 text-[12.5px]">
        <div className="flex items-center justify-between">
          <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
            Status
          </dt>
          <dd className="font-mono text-ink">{status ?? "active"}</dd>
        </div>
        {currentPeriodEnd && (
          <div className="flex items-center justify-between">
            <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
              {cancelAtPeriodEnd ? "Ends" : "Renews"}
            </dt>
            <dd className="font-mono tabular text-ink">
              {new Date(currentPeriodEnd).toLocaleDateString()}
            </dd>
          </div>
        )}
      </dl>
      {hasCustomer && (
        <a
          href="/api/billing/portal"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[13px] font-medium text-ink hover:border-border-strong hover:bg-surface-hover"
        >
          Manage subscription
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

function FeatureRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check size={13} className="mt-0.5 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}
