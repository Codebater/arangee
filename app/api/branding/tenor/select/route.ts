import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { processBuffer, saveImageForUser, type ImageKind } from "@/lib/images";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "media.tenor.com",
  "media1.tenor.com",
  "media2.tenor.com",
  "media3.tenor.com",
  "tenor.googleapis.com",
  "c.tenor.com",
]);

export async function POST(req: Request) {
  const { user } = await requireUser();
  let body: { url?: unknown; kind?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const url = typeof body.url === "string" ? body.url : "";
  const kind = body.kind === "avatar" || body.kind === "banner" ? (body.kind as ImageKind) : null;
  if (!url || !kind) return NextResponse.json({ error: "Missing url or kind" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(parsed.host)) {
    return NextResponse.json({ error: "Disallowed host" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), { cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: "Upstream not OK", status: upstream.status }, { status: 502 });
  }
  const contentType = (upstream.headers.get("content-type") || "image/gif").split(";")[0]!.trim();
  if (contentType !== "image/gif") {
    return NextResponse.json({ error: "Non-GIF response" }, { status: 400 });
  }
  const arrayBuffer = await upstream.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  if (buf.length > 6 * 1024 * 1024) {
    return NextResponse.json({ error: "GIF too large" }, { status: 400 });
  }

  try {
    const processed = await processBuffer(buf, "image/gif", kind);
    const imageId = await saveImageForUser(user, kind, processed);
    return NextResponse.json({
      ok: true,
      id: imageId.toString(),
      url: `/api/images/${imageId.toString()}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
