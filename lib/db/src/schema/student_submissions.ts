import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const studentSubmissionsTable = pgTable("student_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  customField: text("custom_field").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StudentSubmission = typeof studentSubmissionsTable.$inferSelect;
export type InsertStudentSubmission = typeof studentSubmissionsTable.$inferInsert;
