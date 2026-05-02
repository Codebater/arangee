"use client";

import { useState, useTransition } from "react";
import { Loader2, ArrowRight, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ForgotForm() {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    start(async () => {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? "").trim().toLowerCase(),
        }),
      });
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check size={18} />
        </div>
        <p className="text-[14px] font-medium text-ink">Check your inbox</p>
        <p className="text-[12.5px] text-ink-soft">
          If that email matches an account, we sent a reset link.
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <Button type="submit" className="w-full gap-2" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Sending…</span>
          </>
        ) : (
          <>
            <span>Send reset link</span>
            <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
