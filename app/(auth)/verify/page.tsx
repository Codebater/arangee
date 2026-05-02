import Link from "next/link";
import { ObjectId } from "mongodb";
import { Check, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { users, verificationTokens } from "@/lib/collections";

export const metadata = { title: "Verify email · WeSchedule" };
export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await verifyToken(token) : false;

  return (
    <div className="w-full max-w-sm animate-fade-up text-center">
      <div className="mb-10 flex flex-col items-center gap-3">
        <Wordmark size={22} className="text-ink" />
      </div>
      <div className="rounded-xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(15,15,20,0.04)] space-y-4">
        {ok ? (
          <>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check size={18} />
            </div>
            <p className="text-[14px] font-medium text-ink">Email verified</p>
            <p className="text-[12.5px] text-ink-soft">
              You can now sign in to your account.
            </p>
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-ink px-4 text-[13px] font-medium text-bg hover:bg-ink/90"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              <X size={18} />
            </div>
            <p className="text-[14px] font-medium text-ink">Link invalid or expired</p>
            <p className="text-[12.5px] text-ink-soft">
              Try signing up again, or contact support if you already have an account.
            </p>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-[13px] font-medium text-ink hover:bg-surface-hover"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

async function verifyToken(token: string): Promise<boolean> {
  const tokens = await verificationTokens();
  const doc = await tokens.findOne({ token, kind: "email_verify" });
  if (!doc) return false;
  if (doc.expiresAt < new Date()) {
    await tokens.deleteOne({ _id: doc._id });
    return false;
  }
  await (await users()).updateOne(
    { _id: new ObjectId(doc.userId) },
    { $set: { emailVerifiedAt: new Date(), updatedAt: new Date() } },
  );
  await tokens.deleteOne({ _id: doc._id });
  return true;
}
