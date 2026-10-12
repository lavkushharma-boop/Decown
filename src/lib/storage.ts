import "server-only";
import { del } from "@vercel/blob";
import { unlink } from "node:fs/promises";
import path from "node:path";

export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

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
