import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { categories, products, settings } from "@/db/schema";

// Every admin write calls revalidateTag(CATALOG_TAG), so the public site updates immediately.
export const CATALOG_TAG = "catalog";

export const SETTING_DEFAULTS = {
  whatsappNumber: "918504081933",
  instagramUrl: "https://www.instagram.com/decown.in",
  facebookUrl: "https://www.facebook.com/share/1ByDDXLxyj/",
  heroProductId: "",
  heroChipProductId: "",
};
export type SiteSettings = typeof SETTING_DEFAULTS;

export async function readSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(settings);
  const out = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in out) out[r.key as keyof SiteSettings] = r.value;
  return out;
}

export type PublicProduct = { id: number; name: string; description: string; image: string; category: string };

export const getCatalog = unstable_cache(
  async () => {
    const [rows, cats, site] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          image: products.imageUrl,
          category: categories.name,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(eq(products.isActive, true))
        .orderBy(asc(products.sortOrder), asc(products.id)),
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
      readSettings(),
    ]);
    // Only show categories that have at least one visible product.
    const used = new Set(rows.map(r => r.category));
    return {
      products: rows as PublicProduct[],
      categories: cats.filter(c => used.has(c.name)).map(c => c.name),
      settings: site,
    };
  },
  ["catalog"],
  { tags: [CATALOG_TAG] },
);
