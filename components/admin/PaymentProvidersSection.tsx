"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveNowpaymentsKeys, removeNowpaymentsKeys } from "@/server-actions/payments";

interface Props {
  appUrl: string;
  stripeConfigured: boolean;
  stripe: {
    accountId: string | null;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
  } | null;
  nowpayments: {
    connected: boolean;
  };
}

export function PaymentProvidersSection({
  appUrl,
  stripeConfigured,
  stripe,
  nowpayments,
}: Props) {
  return (
    <div className="space-y-8 max-w-2xl">
      <StripeBlock configured={stripeConfigured} stripe={stripe} appUrl={appUrl} />
      <div className="border-t border-border" />
      <NowPaymentsBlock connected={nowpayments.connected} appUrl={appUrl} />
    </div>
  );
}

function StripeBlock({
  configured,
  stripe,
  appUrl,
}: {
  configured: boolean;
  stripe: Props["stripe"];
  appUrl: string;
}) {
  const [pending, start] = useTransition();
  if (!configured) {
    return (
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Stripe
        </p>
        <p className="text-[13px] text-ink-soft">
          Stripe Connect isn&apos;t configured on this server. Set{" "}
          <code className="rounded bg-surface-hover px-1 py-0.5 font-mono text-[12px]">
            STRIPE_SECRET_KEY
          </code>
          ,{" "}
          <code className="rounded bg-surface-hover px-1 py-0.5 font-mono text-[12px]">
            STRIPE_CONNECT_CLIENT_ID
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface-hover px-1 py-0.5 font-mono text-[12px]">
            STRIPE_WEBHOOK_SECRET
          </code>{" "}
          in Vercel.
        </p>
      </div>
    );
  }
  const connected = Boolean(stripe?.chargesEnabled);
  const onboarding = Boolean(stripe?.accountId) && !connected;

  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        Stripe
      </p>
      {connected ? (
        <div className="flex items-center gap-2 text-[13px]">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
            <Check size={12} strokeWidth={3} />
          </span>
          <span className="text-ink">
            Connected · <span className="font-mono text-[12px]">{stripe?.accountId}</span>
          </span>
        </div>
      ) : onboarding ? (
        <div className="flex items-center gap-2 text-[13px] text-warning">
          <AlertCircle size={14} />
          <span>Onboarding incomplete — finish in Stripe to start accepting payments.</span>
        </div>
      ) : (
        <p className="text-[13px] text-ink-soft">
          Each user onboards their own Stripe Express account. Money lands in your
          bank, not on the platform.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/api/integrations/stripe/connect"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-primary bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary-hover"
        >
          {connected ? "Open Stripe onboarding" : onboarding ? "Continue onboarding" : "Connect Stripe"}
          <ExternalLink size={12} />
        </a>
        {connected && (
          <form action="/api/integrations/stripe/disconnect" method="post">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => start(() => Promise.resolve())}
            >
              Disconnect
            </Button>
          </form>
        )}
      </div>
      <p className="text-[11.5px] text-ink-muted">
        Webhook URL (paste into Stripe → Developers → Webhooks):{" "}
        <code className="rounded bg-surface-hover px-1 py-0.5 font-mono text-[11.5px]">
          {appUrl}/api/webhooks/stripe
        </code>
      </p>
    </div>
  );
}

function NowPaymentsBlock({ connected, appUrl }: { connected: boolean; appUrl: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setDone(false);
    start(async () => {
      try {
        await saveNowpaymentsKeys({
          apiKey: String(formData.get("apiKey") ?? "").trim(),
          ipnSecret: String(formData.get("ipnSecret") ?? "").trim(),
        });
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  function disconnect() {
    start(async () => {
      await removeNowpaymentsKeys();
      setDone(false);
    });
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        NowPayments (crypto)
      </p>
      {connected ? (
        <div className="flex items-center gap-2 text-[13px]">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
            <Check size={12} strokeWidth={3} />
          </span>
          <span className="text-ink">Connected · keys stored encrypted</span>
        </div>
      ) : (
        <p className="text-[13px] text-ink-soft">
          Paste your{" "}
          <a
            href="https://nowpayments.io/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline-offset-4 hover:underline"
          >
            NowPayments
          </a>{" "}
          API key + IPN secret. Both are encrypted at rest with AES-256-GCM.
        </p>
      )}
      <form action={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="apiKey">API key</Label>
          <Input
            id="apiKey"
            name="apiKey"
            type="password"
            required
            placeholder={connected ? "•••• replace key ••••" : "API key from NowPayments"}
            className="font-mono text-[12px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ipnSecret">IPN secret</Label>
          <Input
            id="ipnSecret"
            name="ipnSecret"
            type="password"
            required
            placeholder={connected ? "•••• replace secret ••••" : "IPN signing secret"}
            className="font-mono text-[12px]"
          />
        </div>
        {error && <p className="text-[12px] text-danger">{error}</p>}
        {done && <p className="text-[12px] text-success">Saved.</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={pending} className="gap-2">
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <span>{connected ? "Replace keys" : "Save keys"}</span>
            )}
          </Button>
          {connected && (
            <Button type="button" variant="ghost" size="sm" onClick={disconnect} disabled={pending}>
              Disconnect
            </Button>
          )}
        </div>
      </form>
      <p className="text-[11.5px] text-ink-muted">
        IPN URL (paste into NowPayments → Settings → IPN):{" "}
        <code className="rounded bg-surface-hover px-1 py-0.5 font-mono text-[11.5px]">
          {appUrl}/api/webhooks/nowpayments
        </code>
      </p>
    </div>
  );
}
