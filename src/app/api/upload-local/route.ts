import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { blobEnabled } from "@/lib/storage";

const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };

// Local development fallback when no BLOB_READ_WRITE_TOKEN is configured.
// Saves into public/uploads. Disabled in production, where the filesystem is not persistent.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" || blobEnabled()) {
    return NextResponse.json({ error: "Local uploads are disabled" }, { status: 404 });
  }
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof Blob) || !EXT[file.type]) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, WebP or AVIF image" }, { status: 400 });
  }
  const name = `${randomUUID()}.${EXT[file.type]}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
