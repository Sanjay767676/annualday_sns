import { db, sql } from "../../../db/src/index.js";

let initPromise: Promise<void> | null = null;

export function ensureDbReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await db.execute(sql`select 1`);
    })();
  }

  return initPromise;
}
