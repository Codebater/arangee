import { loadImage } from "@/lib/images";

export const runtime = "nodejs";

function toUint8(raw: unknown): Uint8Array | null {
  if (raw instanceof Uint8Array) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as { buffer?: unknown; value?: () => Uint8Array };
    if (typeof obj.value === "function") {
      const v = obj.value();
      if (v instanceof Uint8Array) return v;
    }
    if (obj.buffer instanceof Uint8Array) return obj.buffer;
    if (obj.buffer instanceof ArrayBuffer) return new Uint8Array(obj.buffer);
  }
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const img = await loadImage(id);
  if (!img) return new Response("Not found", { status: 404 });

  const bytes = toUint8(img.data);
  if (!bytes) return new Response("Bad image data", { status: 500 });
  const body = Buffer.from(bytes);
  return new Response(body as unknown as BodyInit, {
    headers: {
      "Content-Type": img.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(body.byteLength),
    },
  });
}
