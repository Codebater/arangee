"use client";

import { useState, useTransition } from "react";
import { Loader2, ArrowRight, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? "").trim().toLowerCase(),
          username: String(formData.get("username") ?? "").trim().toLowerCase(),
          password: String(formData.get("password") ?? ""),
          name: String(formData.get("name") ?? "").trim(),
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error || "Signup failed.");
        return;
      }
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
          We sent a verification link to your email. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
          placeholder="lowercase, digits, hyphens"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full gap-2" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Creating…</span>
          </>
        ) : (
          <>
            <span>Create account</span>
            <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
