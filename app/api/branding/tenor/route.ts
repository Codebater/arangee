import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireUser();
  const apiKey = env().TENOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "tenor_not_configured" }, { status: 503 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  if (!q) return NextResponse.json({ results: [] });

  const tenorUrl = new URL("https://tenor.googleapis.com/v2/search");
  tenorUrl.searchParams.set("q", q);
  tenorUrl.searchParams.set("key", apiKey);
  tenorUrl.searchParams.set("client_key", "weschedule");
  tenorUrl.searchParams.set("limit", "24");
  tenorUrl.searchParams.set("media_filter", "tinygif,gif");
  tenorUrl.searchParams.set("contentfilter", "medium");

  let json: unknown;
  try {
    const r = await fetch(tenorUrl.toString(), { cache: "no-store" });
    if (!r.ok) {
      return NextResponse.json({ error: "tenor_upstream", status: r.status }, { status: 502 });
    }
    json = await r.json();
  } catch {
    return NextResponse.json({ error: "tenor_unreachable" }, { status: 502 });
  }

  const items = (json as { results?: TenorResult[] }).results ?? [];
  const results = items
    .map((it) => {
      const tinygif = it.media_formats?.tinygif?.url;
      const gif = it.media_formats?.gif?.url;
      const fullUrl = gif ?? tinygif;
      const previewUrl = tinygif ?? gif;
      if (!fullUrl || !previewUrl) return null;
      return {
        id: it.id,
        previewUrl,
        fullUrl,
        description: it.content_description ?? "",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({ results });
}

interface TenorResult {
  id: string;
  content_description?: string;
  media_formats?: {
    gif?: { url?: string };
    tinygif?: { url?: string };
  };
}
