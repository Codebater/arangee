import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { processUpload, saveImageForUser, type ImageKind } from "@/lib/images";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { user } = await requireUser();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  const kindRaw = form.get("kind");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (kindRaw !== "avatar" && kindRaw !== "banner") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const kind = kindRaw as ImageKind;

  try {
    const processed = await processUpload(file, kind);
    const imageId = await saveImageForUser(user, kind, processed);
    return NextResponse.json({
      ok: true,
      id: imageId.toString(),
      url: `/api/images/${imageId.toString()}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
