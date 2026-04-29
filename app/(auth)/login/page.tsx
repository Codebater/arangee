import { Suspense } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Kalendly" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="flex flex-col items-center gap-1.5 mb-8">
        <Wordmark size={22} className="text-[--ink]" />
        <p className="text-[12px] uppercase tracking-[0.08em] text-[--ink-muted]">Admin sign-in</p>
      </div>
      <div className="rounded-lg border border-[--border] bg-[--surface] p-6">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
