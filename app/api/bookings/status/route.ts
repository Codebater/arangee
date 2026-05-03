import { NextResponse } from "next/server";
import { getPendingBookingStatus } from "@/lib/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pending = url.searchParams.get("pending") || "";
  if (!pending) return NextResponse.json({ error: "missing_pending" }, { status: 400 });
  const result = await getPendingBookingStatus(pending);
  if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(result);
}
