import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, saveImage } from "@/lib/storage";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const file = (await request.formData()).get("file");
  // Blob (not File) so this also works on Node 18, which has no global File.
  if (!(file instanceof Blob) || !IMAGE_TYPES[file.type]) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, WebP or AVIF image." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image is larger than 4 MB. Please use a smaller photo." }, { status: 413 });
  }
  try {
    const name = "name" in file && typeof file.name === "string" ? file.name : "image";
    return NextResponse.json({ url: await saveImage(file, name) });
  } catch (err) {
    console.error("Image upload failed", err);
    return NextResponse.json({ error: (err as Error).message || "Upload failed." }, { status: 500 });
  }
}
