import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  id: text("id").primaryKey(),
  acceptingResponses: boolean("accepting_responses").notNull().default(false),
  adminPassword: text("admin_password").notNull().default("admin123"),
  passwordInitialized: boolean("password_initialized").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
export type InsertSiteSettings = typeof siteSettingsTable.$inferInsert;