import { loadImage } from "@/lib/images";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const img = await loadImage(id);
  if (!img) return new Response("Not found", { status: 404 });

  const data = img.data instanceof Buffer ? img.data : Buffer.from(img.data as unknown as ArrayBuffer);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(img.sizeBytes),
    },
  });
}
