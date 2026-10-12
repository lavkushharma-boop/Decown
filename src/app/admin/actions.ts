"use server";
import { asc, count, eq, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, products, settings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG, SETTING_DEFAULTS } from "@/lib/data";
import { checkPassword, createSessionToken, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";
import { deleteImage } from "@/lib/storage";

export type FormState = { error?: string; ok?: string } | undefined;

function refresh() {
  revalidateTag(CATALOG_TAG);
  revalidatePath("/admin", "layout");
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/* ---------- auth ---------- */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!process.env.ADMIN_PASSWORD || !process.env.AUTH_SECRET) {
    return { error: "ADMIN_PASSWORD and AUTH_SECRET must be set in the environment." };
  }
  if (!(await checkPassword(String(fd.get("password") ?? "")))) {
    await new Promise(r => setTimeout(r, 600)); // slow down guessing
    return { error: "Incorrect password." };
  }
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  redirect("/admin/products");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ---------- products ---------- */

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const data = {
    name: str(fd, "name"),
    description: str(fd, "description"),
    imageUrl: str(fd, "imageUrl"),
    categoryId: Number(fd.get("categoryId")),
    isActive: fd.get("isActive") === "on",
  };
  if (!data.name) return { error: "Product name is required." };
  if (!data.imageUrl) return { error: "Please upload a product image." };
  if (!data.categoryId) return { error: "Please choose a category." };

  if (id) {
    const [old] = await db.select({ imageUrl: products.imageUrl }).from(products).where(eq(products.id, id));
    if (!old) return { error: "This product no longer exists." };
    await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id));
    if (old.imageUrl !== data.imageUrl) await deleteImage(old.imageUrl);
  } else {
    // New products go to the top of the collection.
    const [{ min }] = await db.select({ min: sql<number>`coalesce(min(${products.sortOrder}), 0)` }).from(products);
    await db.insert(products).values({ ...data, sortOrder: Number(min) - 1 });
  }
  refresh();
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  const [row] = await db.delete(products).where(eq(products.id, id)).returning({ imageUrl: products.imageUrl });
  if (row) await deleteImage(row.imageUrl);
  refresh();
}

export async function setProductActive(id: number, isActive: boolean) {
  await requireAdmin();
  await db.update(products).set({ isActive, updatedAt: new Date() }).where(eq(products.id, id));
  refresh();
}

export async function reorderProducts(ids: number[]) {
  await requireAdmin();
  await db.transaction(async tx => {
    for (const [i, id] of ids.entries()) {
      await tx.update(products).set({ sortOrder: i }).where(eq(products.id, id));
    }
  });
  refresh();
}

/* ---------- categories ---------- */

export async function createCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) return { error: "Category name is required." };
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${categories.sortOrder}), 0)` }).from(categories);
  const inserted = await db.insert(categories).values({ name, sortOrder: Number(max) + 1 }).onConflictDoNothing().returning();
  if (!inserted.length) return { error: `"${name}" already exists.` };
  refresh();
  return { ok: `Added "${name}".` };
}

export async function renameCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const name = str(fd, "name");
  if (!name) return { error: "Category name is required." };
  try {
    await db.update(categories).set({ name }).where(eq(categories.id, id));
  } catch {
    return { error: `"${name}" already exists.` };
  }
  refresh();
  return { ok: "Saved." };
}

export async function deleteCategory(id: number): Promise<FormState> {
  await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(products).where(eq(products.categoryId, id));
  if (n > 0) return { error: `Move or delete its ${n} product${n === 1 ? "" : "s"} first.` };
  await db.delete(categories).where(eq(categories.id, id));
  refresh();
  return { ok: "Deleted." };
}

export async function moveCategory(id: number, dir: -1 | 1) {
  await requireAdmin();
  const list = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  const i = list.findIndex(c => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.transaction(async tx => {
    for (const [k, c] of list.entries()) await tx.update(categories).set({ sortOrder: k }).where(eq(categories.id, c.id));
  });
  refresh();
}

/* ---------- settings ---------- */

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const whatsapp = str(fd, "whatsappNumber").replace(/\D/g, "");
  if (whatsapp.length < 10) return { error: "Enter the WhatsApp number with country code, e.g. 918504081933." };
  const values: Record<string, string> = { ...Object.fromEntries(Object.keys(SETTING_DEFAULTS).map(k => [k, str(fd, k)])), whatsappNumber: whatsapp };
  await db.transaction(async tx => {
    for (const [key, value] of Object.entries(values)) {
      await tx.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
    }
  });
  refresh();
  return { ok: "Settings saved." };
}
