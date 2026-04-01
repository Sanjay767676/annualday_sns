import { db, sql } from "../../../db/src/index.js";

let initPromise: Promise<void> | null = null;

export function ensureDbReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await db.execute(sql`
        create table if not exists faculty_submissions (
          id uuid primary key,
          data jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now()
        )
      `);

      await db.execute(sql`
        create table if not exists student_submissions (
          id uuid primary key,
          name text,
          email text,
          custom_field text,
          data jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now()
        )
      `);
    })();
  }

  return initPromise;
}
