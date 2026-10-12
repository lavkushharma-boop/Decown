import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { blobEnabled } from "@/lib/storage";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  return (
    <>
      <div className="a-head">
        <div>
          <h1>Add product</h1>
          <p><Link href="/admin/products">← All products</Link></p>
        </div>
      </div>
      <ProductForm categories={cats} blobEnabled={blobEnabled()} />
    </>
  );
}
