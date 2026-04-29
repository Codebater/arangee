export const dynamic = "force-dynamic";

import { ObjectId } from "mongodb";
import { availability, users } from "@/lib/collections";
import { requireAdmin } from "@/lib/auth-helpers";
import { AvailabilityEditor } from "@/components/admin/AvailabilityEditor";

export default async function AvailabilityPage() {
  const session = await requireAdmin();
  const user = await (await users()).findOne({ _id: new ObjectId(session.user.id) });
  if (!user) throw new Error("User missing");
  const doc = await (await availability()).findOne({ userId: user._id });
  const initial = doc
    ? { timezone: doc.timezone, weeklyHours: doc.weeklyHours, dateOverrides: doc.dateOverrides }
    : {
        timezone: "UTC",
        weeklyHours: [0, 1, 2, 3, 4, 5, 6].map((d) => ({
          dayOfWeek: d as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          intervals: d === 0 || d === 6 ? [] : [{ start: "09:00", end: "17:00" }],
        })),
        dateOverrides: [],
      };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display">Availability</h1>
        <p className="text-[--color-ink-muted] text-sm mt-1">When you're available to take meetings.</p>
      </header>
      <AvailabilityEditor initial={initial} />
    </div>
  );
}
