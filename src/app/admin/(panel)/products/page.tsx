import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { ProductTable } from "@/components/admin/ProductTable";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const [rows, cats] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        category: categories.name,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(asc(products.sortOrder), asc(products.id)),
    db.select({ name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);
  const live = rows.filter(r => r.isActive).length;

  return (
    <>
      <div className="a-head">
        <div>
          <h1>Products</h1>
          <p>{rows.length} total · {live} visible on the website</p>
        </div>
        <Link className="btn" href="/admin/products/new">+ Add product</Link>
      </div>
      {saved && <p className="msg ok">Product saved. It is live on the website now.</p>}
      <ProductTable initial={rows} categories={cats.map(c => c.name)} />
    </>
  );
}
