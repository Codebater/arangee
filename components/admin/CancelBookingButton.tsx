"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { cancelBookingByAdmin } from "@/server-actions/bookings";

interface Props {
  bookingId: string;
  guestName: string;
  hasPayment: boolean;
}

export function CancelBookingButton({ bookingId, guestName, hasPayment }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ refunded: number; currency: string | null } | null>(null);

  function onClick() {
    const msg = hasPayment
      ? `Cancel ${guestName}'s booking? The guest will receive a cancellation email with a reschedule link, and any refund per your policy will be processed.`
      : `Cancel ${guestName}'s booking? The guest will receive a cancellation email with a reschedule link.`;
    if (!confirm(msg)) return;
    setError(null);
    start(async () => {
      try {
        const result = await cancelBookingByAdmin(bookingId);
        setDone({ refunded: result.refundAmountCents, currency: result.refundCurrency });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cancel failed.");
      }
    });
  }

  if (done) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-success">
        Cancelled
        {done.refunded > 0 && done.currency
          ? ` · refunded ${(done.refunded / 100).toFixed(2)} ${done.currency}`
          : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && (
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-danger">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        title="Cancel booking"
        aria-label="Cancel booking"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? <Loader2 className="animate-spin" size={13} /> : <X size={13} />}
      </button>
    </span>
  );
}
