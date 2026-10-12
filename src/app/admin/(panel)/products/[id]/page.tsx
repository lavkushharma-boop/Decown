import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [[product], cats] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);
  if (!product) notFound();
  return (
    <>
      <div className="a-head">
        <div>
          <h1>Edit product</h1>
          <p><Link href="/admin/products">← All products</Link></p>
        </div>
      </div>
      <ProductForm product={product} categories={cats} />
    </>
  );
}
