"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

interface Props {
  pendingId: string;
  username: string;
  slug: string;
}

type Status = "awaiting" | "completed" | "expired";

export function BookingStatusPoller({ pendingId, username, slug }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("awaiting");
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;
      try {
        const res = await fetch(
          `/api/bookings/status?pending=${encodeURIComponent(pendingId)}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const j = (await res.json()) as { status: Status; manageToken?: string | null };
          if (j.status === "completed" && j.manageToken) {
            setStatus("completed");
            router.replace(
              `/${username}/${slug}/booked?token=${encodeURIComponent(j.manageToken)}`,
            );
            return;
          }
          if (j.status === "expired") {
            setStatus("expired");
            return;
          }
        }
      } catch {
        /* ignore, retry */
      }
      setTries((t) => t + 1);
      timer = setTimeout(tick, 1500);
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pendingId, router, slug, username]);

  if (status === "expired") {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
          <X size={18} />
        </div>
        <p className="text-[14px] font-medium text-ink">Payment didn&apos;t complete</p>
        <p className="text-[12.5px] text-ink-soft">
          The checkout expired or was cancelled. Pick a slot again to retry.
        </p>
        <a
          href={`/${username}/${slug}`}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-[13px] font-medium text-ink hover:bg-surface-hover"
        >
          Pick another time
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-tint text-primary">
        <Loader2 className="animate-spin" size={18} />
      </div>
      <p className="text-[14px] font-medium text-ink">Confirming your payment…</p>
      <p className="text-[12.5px] text-ink-soft">
        We&apos;re finalizing your booking. This usually takes a few seconds.
      </p>
      {tries >= 12 && (
        <p className="text-[11.5px] text-ink-muted">
          Still working on it. If this takes more than a minute, refresh the page.
        </p>
      )}
    </div>
  );
}
