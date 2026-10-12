import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Reuse one client across hot reloads in dev and across invocations on a warm serverless instance.
// postgres() is lazy: nothing connects until the first query runs.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

// prepare:false keeps it compatible with Neon's pooled (pgbouncer) connection string.
// DATABASE_POOL_MAX=1 is only needed for the local PGlite server (npm run db:local).
const client = (globalForDb.pgClient ??= postgres(process.env.DATABASE_URL as string, {
  prepare: false,
  max: Number(process.env.DATABASE_POOL_MAX) || 5,
}));

export const db = drizzle({ client, schema });
