import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Reset password · WeSchedule" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="mb-10 flex flex-col items-center gap-3">
        <Wordmark size={22} className="text-ink" />
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Choose a new password
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(15,15,20,0.04)]">
        {token ? (
          <ResetForm token={token} />
        ) : (
          <p className="text-[12.5px] text-danger">Reset link is missing or invalid.</p>
        )}
      </div>
      <p className="mt-6 text-center text-[12px] text-ink-muted">
        <Link href="/login" className="text-ink underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
