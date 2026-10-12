import "server-only";
import { del, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Vercel Blob is configured either with a read-write token (older stores) or
// with BLOB_STORE_ID + the deployment's OIDC token (newer stores).
export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

export const IMAGE_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };
// Vercel functions reject request bodies over 4.5 MB; the admin resizes images well below this first.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const slug = (s: string) => s.toLowerCase().replace(/\.\w+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "image";

export async function saveImage(file: Blob, name: string): Promise<string> {
  const ext = IMAGE_TYPES[file.type];
  if (blobEnabled()) {
    const res = await put(`products/${slug(name)}.${ext}`, file, { access: "public", contentType: file.type, addRandomSuffix: true });
    return res.url;
  }
  // Local development without Blob: keep files in public/uploads (not persistent on Vercel).
  if (process.env.NODE_ENV === "production") throw new Error("Image storage is not configured (connect Vercel Blob).");
  const fileName = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${fileName}`;
}

// Remove an image we no longer reference. Failures are logged, never thrown:
// a leftover file is harmless, a failed product save is not.
export async function deleteImage(url: string | null | undefined) {
  if (!url) return;
  try {
    if (url.includes(".blob.vercel-storage.com/") && blobEnabled()) await del(url);
    else if (url.startsWith("/uploads/")) await unlink(path.join(process.cwd(), "public", url));
  } catch (err) {
    console.warn("Could not delete image", url, err);
  }
}
