import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;
type PoolOptions = ConstructorParameters<typeof Pool>[0];

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const poolOptions: PoolOptions = { connectionString: databaseUrl };

try {
  const parsed = new URL(databaseUrl);
  const sslMode = (parsed.searchParams.get("sslmode") || "").toLowerCase();
  const isLocalHost = ["localhost", "127.0.0.1"].includes(parsed.hostname);

  if (sslMode === "disable") {
    poolOptions.ssl = false;
  } else if (sslMode === "no-verify") {
    poolOptions.ssl = { rejectUnauthorized: false };
  } else if (!isLocalHost) {
    poolOptions.ssl = { rejectUnauthorized: false };
  }
} catch {
  // If URL parsing fails, Pool will raise a detailed error at connection time.
}

export const pool = new Pool(poolOptions);
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
export { sql, gte } from "drizzle-orm";

// Export Prisma client for modern ORM usage
export { prisma } from "./prisma-client.js";
