"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const verified = search.get("verified") === "1";
  const reset = search.get("reset") === "1";
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    start(async () => {
      const res = await signIn("credentials", {
        redirect: false,
        email: String(formData.get("email") ?? "").trim().toLowerCase(),
        password: String(formData.get("password") ?? ""),
      });
      if (res?.error) {
        if (res.code === "email_not_verified") {
          setError("Please verify your email first. Check your inbox for the link.");
        } else {
          setError("Invalid email or password.");
        }
        return;
      }
      router.push(next);
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      {verified && (
        <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[12.5px] text-ink">
          Email verified — you can now sign in.
        </p>
      )}
      {reset && (
        <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[12.5px] text-ink">
          Password updated — sign in with your new password.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot"
            className="text-[11.5px] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
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
            <span>Signing in…</span>
          </>
        ) : (
          <>
            <span>Sign in</span>
            <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
