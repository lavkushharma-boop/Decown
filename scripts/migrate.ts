import "./env";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Runs on every build (see package.json). Applies only migrations not yet applied.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

async function main() {
  if (!url) {
    console.warn("⚠ DATABASE_URL not set; skipping migrations.");
    return;
  }
  const client = postgres(url, { max: 1, onnotice: () => {} });
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  await client.end();
  console.log("✓ Database migrations applied");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
