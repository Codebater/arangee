"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/server-actions/account";

export function PasswordSection() {
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setSavedAt(null);
    const current = String(formData.get("current") ?? "");
    const next = String(formData.get("next") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    start(async () => {
      try {
        await changePassword({ current, next });
        setSavedAt(Date.now());
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("INVALID_CURRENT")) {
          setError("Current password is incorrect.");
        } else {
          setError(msg || "Could not change password.");
        }
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 max-w-md" autoComplete="on">
      <div className="space-y-2">
        <Label htmlFor="current">Current password</Label>
        <Input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="next">New password</Label>
        <Input
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}
      {savedAt && (
        <p className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12.5px] text-ink">
          <Check size={13} className="text-success" />
          Password updated.
        </p>
      )}
      <Button type="submit" disabled={pending} className="gap-2">
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Saving…</span>
          </>
        ) : (
          <span>Change password</span>
        )}
      </Button>
    </form>
  );
}
