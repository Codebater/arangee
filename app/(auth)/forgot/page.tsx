import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Forgot password · WeSchedule" };

export default function ForgotPage() {
  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-10 flex flex-col items-center gap-3">
        <Wordmark size={22} className="text-ink" />
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Reset your password
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(15,15,20,0.04)]">
        <ForgotForm />
      </div>
      <p className="mt-6 text-center text-[12px] text-ink-muted">
        <Link href="/login" className="text-ink underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
