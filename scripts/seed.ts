/**
 * One-time import of the original catalogue.html into the database.
 *   npm run db:seed            # refuses if products already exist
 *   npm run db:seed -- --force # wipes products/categories first
 *
 * Images go to Vercel Blob when BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID (+ VERCEL_OIDC_TOKEN) is set,
 * otherwise to public/uploads (local dev only).
 */
import "./env";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { put } from "@vercel/blob";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories, products, settings } from "../src/db/schema";

const SOURCE = process.argv.find(a => a.endsWith(".html")) ?? "catalogue.html";
const FORCE = process.argv.includes("--force");

type Raw = { name: string; category: string; description: string; image: string };

function parseCatalogue(html: string) {
  const imgBlock = html.match(/const IMG = \{([\s\S]*?)\n\};/)?.[1];
  const listBlock = html.match(/const products = (\[[\s\S]*?\n\]);/)?.[1];
  if (!imgBlock || !listBlock) throw new Error(`Could not find IMG / products in ${SOURCE}`);

  const images = new Map<string, { type: string; data: Buffer }>();
  for (const m of imgBlock.matchAll(/(\w+):"data:(image\/\w+);base64,([^"]+)"/g)) {
    images.set(m[1], { type: m[2], data: Buffer.from(m[3], "base64") });
  }
  // Evaluate the product list with IMG.pNN resolving to the key "pNN".
  const IMG = new Proxy({}, { get: (_, k) => String(k) });
  const list = vm.runInNewContext(listBlock, { IMG }) as Raw[];
  return { images, list };
}

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function storeImage(key: string, name: string, img: { type: string; data: Buffer }) {
  const ext = img.type.split("/")[1];
  if (useBlob) {
    const res = await put(`products/${slug(name)}.${ext}`, img.data, { access: "public", contentType: img.type, addRandomSuffix: true });
    return res.url;
  }
  const dir = path.join("public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `seed-${key}.${ext}`), img.data);
  return `/uploads/seed-${key}.${ext}`;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const client = postgres(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  const db = drizzle(client);

  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length && !FORCE) {
    console.log("Products already exist. Re-run with --force to wipe and re-import.");
    await client.end();
    return;
  }

  const { images, list } = parseCatalogue(fs.readFileSync(SOURCE, "utf8"));
  console.log(`Found ${list.length} products and ${images.size} images in ${SOURCE}`);
  console.log(useBlob ? "Uploading images to Vercel Blob…" : "No Blob credentials: saving images to public/uploads (local only)");

  // Upload first (slow, network), then write the DB in one transaction.
  const urls: string[] = [];
  for (const [i, p] of list.entries()) {
    const img = images.get(p.image);
    if (!img) throw new Error(`Missing image ${p.image} for "${p.name}"`);
    urls.push(await storeImage(p.image, p.name, img));
    process.stdout.write(`\r  ${i + 1}/${list.length}`);
  }
  process.stdout.write("\n");

  const catNames = [...new Set(list.map(p => p.category))];
  await db.transaction(async tx => {
    if (FORCE) {
      await tx.delete(products);
      await tx.delete(categories);
    }
    const cats = await tx.insert(categories).values(catNames.map((name, i) => ({ name, sortOrder: i }))).returning();
    const catId = new Map(cats.map(c => [c.name, c.id]));
    const rows = await tx
      .insert(products)
      .values(list.map((p, i) => ({ name: p.name, description: p.description, imageUrl: urls[i], categoryId: catId.get(p.category)!, sortOrder: i })))
      .returning({ id: products.id });

    // The original hero used p01 (large) and p16 (small).
    const hero = { heroProductId: rows[list.findIndex(p => p.image === "p01")]?.id, heroChipProductId: rows[list.findIndex(p => p.image === "p16")]?.id };
    for (const [key, id] of Object.entries(hero)) {
      if (!id) continue;
      await tx.insert(settings).values({ key, value: String(id) }).onConflictDoUpdate({ target: settings.key, set: { value: String(id) } });
    }
  });

  console.log(`✓ Imported ${list.length} products in ${catNames.length} categories`);
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
