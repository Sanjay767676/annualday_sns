import { pgTable, text, uuid, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const deletionHistoryTable = pgTable("deletion_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // "student" or "faculty"
  section: text("section").notNull(), // "firstRankHolders", "semesterWiseRankers", etc.
  submissionId: text("submission_id").notNull(),
  rowIndex: integer("row_index"), // null = entire submission deleted, number = specific entry deleted
  deletedEntry: jsonb("deleted_entry").notNull(), // the actual data that was deleted
  deletedAt: timestamp("deleted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DeletionHistory = typeof deletionHistoryTable.$inferSelect;
export type InsertDeletionHistory = typeof deletionHistoryTable.$inferInsert;
