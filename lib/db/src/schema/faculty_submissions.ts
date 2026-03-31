import { pgTable, text, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";

export const facultySubmissionsTable = pgTable("faculty_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FacultySubmission = typeof facultySubmissionsTable.$inferSelect;
export type InsertFacultySubmission = typeof facultySubmissionsTable.$inferInsert;
