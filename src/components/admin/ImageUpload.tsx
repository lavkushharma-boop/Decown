"use client";
import { useRef, useState } from "react";

const MAX_SIDE = 1600;

// Downscale large phone photos and convert to WebP before uploading.
async function optimise(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/webp", 0.86));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

// Must stay under the 4.5 MB request limit of Vercel functions (checked again on the server).
const MAX_BYTES = 4 * 1024 * 1024;

export function ImageUpload({ name, defaultUrl }: { name: string; defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    setError("");
    setBusy(true);
    try {
      const f = await optimise(file);
      if (f.size > MAX_BYTES) throw new Error("Image is larger than 4 MB. Please use a smaller photo.");
      const body = new FormData();
      body.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Upload failed. Please try again.");
      setUrl(json.url);
    } catch (e) {
      setError((e as Error).message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div
        className={`upload${drag ? " drag" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={url ? "Replace image" : "Upload image"}
        onClick={() => input.current?.click()}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      >
        {url ? (
          <img src={url} alt="Product preview" />
        ) : (
          <div className="ph">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
            <b>Click or drop an image</b>
            <div>JPG, PNG or WebP</div>
          </div>
        )}
        {busy && <div className="busy">Uploading…</div>}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={e => handle(e.target.files?.[0])} />
      {error && <p className="msg err" style={{ marginTop: 10 }}>{error}</p>}
      {url && !busy && (
        <button type="button" className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => input.current?.click()}>
          Replace image
        </button>
      )}
    </div>
  );
}
