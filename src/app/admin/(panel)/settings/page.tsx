import { asc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { readSettings } from "@/lib/data";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const [settings, list] = await Promise.all([
    readSettings(),
    db.select({ id: products.id, name: products.name }).from(products).orderBy(asc(products.sortOrder), asc(products.id)),
  ]);
  return (
    <>
      <div className="a-head">
        <div>
          <h1>Settings</h1>
          <p>Contact details and the images shown at the top of the website.</p>
        </div>
      </div>
      <SettingsForm settings={settings} products={list} />
    </>
  );
}
