import { db, sql } from "../../../db/src/index.js";

let initPromise: Promise<void> | null = null;

export function ensureDbReady(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await db.execute(sql`create extension if not exists pgcrypto`);

      await db.execute(sql`
        create table if not exists faculty_submissions (
          id uuid primary key default gen_random_uuid(),
          data jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now()
        )
      `);

      await db.execute(sql`
        create table if not exists student_submissions (
          id uuid primary key default gen_random_uuid(),
          name text,
          email text,
          custom_field text,
          data jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default now()
        )
      `);

      await db.execute(sql`alter table faculty_submissions alter column id set default gen_random_uuid()`);
      await db.execute(sql`alter table student_submissions alter column id set default gen_random_uuid()`);
    })();
  }

  return initPromise;
}
