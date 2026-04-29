"use client";

import { useState, useMemo, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SlotPicker } from "./SlotPicker";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

interface Slot {
  startUtc: string;
  endUtc: string;
}

export function BookingCalendar({
  slug,
  slots,
  ownerTimezone,
}: {
  slug: string;
  slots: Slot[];
  ownerTimezone: string;
}) {
  const [guestTz, setGuestTz] = useState<string>("UTC");
  useEffect(() => {
    setGuestTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  const days = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) {
      const z = toZonedTime(new Date(s.startUtc), guestTz);
      const ymd = `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`;
      set.add(ymd);
    }
    return set;
  }, [slots, guestTz]);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selected, setSelected] = useState<Slot | undefined>(undefined);
  const router = useRouter();

  const selectedYmd = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="rounded-lg border border-[--border] bg-[--surface] p-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setSelected(undefined);
            }}
            modifiers={{
              available: (d) => {
                const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                return days.has(ymd);
              },
            }}
            modifiersClassNames={{ available: "font-medium text-[--primary]" }}
            disabled={(d) => {
              const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              return !days.has(ymd);
            }}
          />
        </div>
        <p className="text-[11px] text-[--ink-muted] mt-3 flex items-center gap-1">
          <span>Timezone</span>
          <span className="font-mono text-[--ink-soft]">{guestTz}</span>
        </p>
      </div>
      <div className="space-y-4">
        {!date && (
          <p className="text-[13px] text-[--ink-muted]">
            Select a date to see available times.
          </p>
        )}
        {date && (
          <>
            <h3 className="text-base">
              {formatInTimeZone(date, guestTz, "EEEE, MMMM d")}
            </h3>
            <SlotPicker
              slots={slots}
              selectedDate={selectedYmd}
              guestTimezone={guestTz}
              selected={selected?.startUtc}
              onSelect={setSelected}
            />
            {selected && (
              <Button
                size="lg"
                onClick={async () => {
                  const params = new URLSearchParams(window.location.search);
                  const reschedule = params.get("reschedule");
                  if (reschedule) {
                    const res = await fetch(`/api/bookings/${reschedule}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ newStartUtc: selected!.startUtc }),
                    });
                    if (res.ok) {
                      const { token } = await res.json();
                      router.push(`/${slug}/booked?token=${token}`);
                    } else {
                      alert("Could not reschedule.");
                    }
                  } else {
                    router.push(
                      `/${slug}/confirm?start=${encodeURIComponent(selected!.startUtc)}&tz=${encodeURIComponent(guestTz)}`,
                    );
                  }
                }}
                className="w-full"
              >
                Confirm {formatInTimeZone(new Date(selected.startUtc), guestTz, "h:mm a")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
