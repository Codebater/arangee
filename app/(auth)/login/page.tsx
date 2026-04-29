import { Suspense } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Kalendly" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-10 animate-fade-up">
      <div className="flex flex-col items-center gap-2">
        <Wordmark className="h-8 w-auto" />
        <p className="text-sm text-[--color-ink-muted]">Admin sign-in</p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
