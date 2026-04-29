"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ManagePanel({ token, slug }: { token: string; slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (done) {
    return (
      <p className="text-[13px] text-[--ink-muted]">This booking has been cancelled.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="w-full"
        onClick={() => router.push(`/${slug}?reschedule=${token}`)}
      >
        Reschedule
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          start(async () => {
            const res = await fetch(`/api/bookings/${token}`, { method: "DELETE" });
            if (res.ok) setDone(true);
          });
        }}
        disabled={pending}
      >
        {pending ? "Cancelling..." : confirming ? "Click again to confirm cancel" : "Cancel"}
      </Button>
    </div>
  );
}
