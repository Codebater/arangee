"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initial: { email: string; calendarSummary: string } | null;
}

export function AppleSyncSection({ initial }: Props) {
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [connected, setConnected] = useState(initial);

  function setError_(message: string | null) {
    setError(message);
    setTestResult(null);
  }

  async function onTest() {
    setError_(null);
    setTestResult(null);
    start(async () => {
      const res = await fetch("/api/integrations/apple/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, appPassword }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          j.error === "invalid_credentials"
            ? "Apple rejected those credentials. Double-check the email and that the password is an app-specific password."
            : j.error || "Test failed.",
        );
        return;
      }
      const j = (await res.json()) as { ok: boolean; calendarCount: number };
      setTestResult(`Reachable, found ${j.calendarCount} calendar${j.calendarCount === 1 ? "" : "s"}.`);
    });
  }

  async function onConnect() {
    setError_(null);
    start(async () => {
      const res = await fetch("/api/integrations/apple/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, appPassword }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          j.error === "invalid_credentials"
            ? "Apple rejected those credentials."
            : j.error === "no_writable_calendar"
              ? "No writable calendar found in iCloud."
              : j.error || "Connect failed.",
        );
        return;
      }
      setConnected({ email: email.trim(), calendarSummary: "iCloud" });
      setEmail("");
      setAppPassword("");
    });
  }

  async function onDisconnect() {
    if (!confirm("Stop mirroring bookings to your Apple Calendar?")) return;
    start(async () => {
      const res = await fetch("/api/integrations/apple/disconnect", { method: "POST" });
      if (res.ok) setConnected(null);
    });
  }

  if (connected) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-bg-elevated p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
            <Check size={12} strokeWidth={3} />
          </span>
          <p className="text-[13px] text-ink">
            Mirroring bookings to <strong>{connected.email}</strong> ·{" "}
            {connected.calendarSummary}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          disabled={pending}
          className="text-ink-muted hover:text-danger"
        >
          {pending ? <Loader2 className="animate-spin" size={13} /> : "Disconnect Apple Calendar"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-bg-elevated p-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Apple Calendar mirror
        </p>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          Optional. Mirrors every confirmed booking to your iCloud Calendar so it shows up on
          your iPhone / Mac. Availability is still read from Google.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apple-email">Apple ID email</Label>
        <Input
          id="apple-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@icloud.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="apple-password">App-specific password</Label>
        <Input
          id="apple-password"
          type="password"
          autoComplete="off"
          value={appPassword}
          onChange={(e) => setAppPassword(e.target.value)}
          placeholder="xxxx-xxxx-xxxx-xxxx"
          className="font-mono"
        />
        <p className="text-[11.5px] text-ink-muted">
          Apple requires a separate app-specific password — your normal Apple ID password won&apos;t
          work.{" "}
          <a
            href="https://account.apple.com/sign-in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-ink underline-offset-4 hover:underline"
          >
            Generate one <ExternalLink size={10} />
          </a>{" "}
          (Sign-In &amp; Security → App-Specific Passwords).
        </p>
      </div>

      {testResult && (
        <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12.5px] text-ink">
          {testResult}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={pending || !email || !appPassword}
          className="gap-1.5"
        >
          {pending ? <Loader2 className="animate-spin" size={13} /> : null}
          Test connection
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onConnect}
          disabled={pending || !email || !appPassword}
          className="gap-1.5"
        >
          {pending ? <Loader2 className="animate-spin" size={13} /> : null}
          Connect Apple Calendar
        </Button>
      </div>
    </div>
  );
}
