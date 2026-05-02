import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireUser();
  const apiKey = env().GIPHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "giphy_not_configured" }, { status: 503 });
  }
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  if (!q) return NextResponse.json({ results: [] });

  const giphyUrl = new URL("https://api.giphy.com/v1/gifs/search");
  giphyUrl.searchParams.set("q", q);
  giphyUrl.searchParams.set("api_key", apiKey);
  giphyUrl.searchParams.set("limit", "24");
  giphyUrl.searchParams.set("rating", "pg-13");
  giphyUrl.searchParams.set("bundle", "messaging_non_clips");

  let json: unknown;
  try {
    const r = await fetch(giphyUrl.toString(), { cache: "no-store" });
    if (!r.ok) {
      return NextResponse.json({ error: "giphy_upstream", status: r.status }, { status: 502 });
    }
    json = await r.json();
  } catch {
    return NextResponse.json({ error: "giphy_unreachable" }, { status: 502 });
  }

  const items = (json as { data?: GiphyResult[] }).data ?? [];
  const results = items
    .map((it) => {
      const previewUrl = it.images?.fixed_height_small?.url ?? it.images?.fixed_height?.url;
      const fullUrl =
        it.images?.fixed_height?.url ??
        it.images?.downsized_medium?.url ??
        it.images?.original?.url;
      if (!fullUrl || !previewUrl) return null;
      return {
        id: it.id,
        previewUrl,
        fullUrl,
        description: it.title ?? "",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({ results });
}

interface GiphyImage {
  url?: string;
}
interface GiphyResult {
  id: string;
  title?: string;
  images?: {
    fixed_height_small?: GiphyImage;
    fixed_height?: GiphyImage;
    downsized_medium?: GiphyImage;
    original?: GiphyImage;
  };
}
