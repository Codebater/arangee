import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up · WeSchedule" };

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-10 flex flex-col items-center gap-3">
        <Wordmark size={22} className="text-ink" />
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Create your account
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(15,15,20,0.04)]">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-[12px] text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
