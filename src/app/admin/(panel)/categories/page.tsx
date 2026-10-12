import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function CategoriesPage() {
  const rows = await db
    .select({ id: categories.id, name: categories.name, products: count(products.id) })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return (
    <>
      <div className="a-head">
        <div>
          <h1>Categories</h1>
          <p>These appear as filter buttons on the website, in this order.</p>
        </div>
      </div>
      <CategoryManager rows={rows} />
    </>
  );
}
