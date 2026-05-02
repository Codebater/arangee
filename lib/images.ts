import sharp from "sharp";
import { ObjectId } from "mongodb";
import { images, users } from "./collections";
import type { ImageDoc, UserDoc } from "./types";

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_GIF_BYTES = 6 * 1024 * 1024;
const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const TARGETS = {
  avatar: { maxW: 256, maxH: 256, quality: 80 },
  banner: { maxW: 1600, maxH: 240, quality: 76 },
} as const;

export type ImageKind = "avatar" | "banner";

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  contentType: ImageDoc["contentType"];
  sizeBytes: number;
}

export async function processUpload(
  file: File,
  kind: ImageKind,
): Promise<ProcessedImage> {
  if (!ALLOWED_MIMES.has(file.type)) {
    throw new Error("Only PNG, JPEG, WebP, or GIF files are accepted.");
  }
  const isGif = file.type === "image/gif";
  const limit = isGif ? MAX_GIF_BYTES : MAX_INPUT_BYTES;
  if (file.size > limit) {
    throw new Error(
      `${isGif ? "GIF" : "Image"} must be smaller than ${Math.round(limit / 1024 / 1024)} MB.`,
    );
  }
  const arrayBuffer = await file.arrayBuffer();
  const input = Buffer.from(arrayBuffer);
  return processBuffer(input, file.type, kind);
}

export async function processBuffer(
  input: Buffer,
  mime: string,
  kind: ImageKind,
): Promise<ProcessedImage> {
  if (mime === "image/gif") {
    return {
      buffer: input,
      contentType: "image/gif",
      sizeBytes: input.length,
      width: 0,
      height: 0,
    };
  }
  const target = TARGETS[kind];
  const pipeline = sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: target.maxW,
      height: target.maxH,
      fit: kind === "avatar" ? "cover" : "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: target.quality });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  return {
    buffer: data,
    width: info.width,
    height: info.height,
    contentType: "image/webp",
    sizeBytes: data.length,
  };
}

export async function saveImageForUser(
  user: UserDoc,
  kind: ImageKind,
  processed: ProcessedImage,
): Promise<ObjectId> {
  const col = await images();
  const doc: ImageDoc = {
    _id: new ObjectId(),
    ownerUserId: user._id,
    contentType: processed.contentType,
    data: processed.buffer,
    sizeBytes: processed.sizeBytes,
    width: processed.width,
    height: processed.height,
    kind,
    createdAt: new Date(),
  };
  await col.insertOne(doc);

  const fieldName = kind === "avatar" ? "avatarImageId" : "bannerImageId";
  const branding = user.branding ?? {};
  const previousId = branding[fieldName];
  await (await users()).updateOne(
    { _id: user._id },
    {
      $set: {
        [`branding.${fieldName}`]: doc._id,
        updatedAt: new Date(),
      },
    },
  );
  if (previousId) {
    await col.deleteOne({ _id: previousId, ownerUserId: user._id }).catch(() => {});
  }
  return doc._id;
}

export async function removeImageForUser(user: UserDoc, kind: ImageKind): Promise<void> {
  const fieldName = kind === "avatar" ? "avatarImageId" : "bannerImageId";
  const previousId = user.branding?.[fieldName];
  if (!previousId) return;
  await (await users()).updateOne(
    { _id: user._id },
    {
      $unset: { [`branding.${fieldName}`]: "" },
      $set: { updatedAt: new Date() },
    },
  );
  await (await images()).deleteOne({ _id: previousId, ownerUserId: user._id }).catch(() => {});
}

export async function loadImage(id: string): Promise<ImageDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  return (await images()).findOne({ _id: new ObjectId(id) });
}
