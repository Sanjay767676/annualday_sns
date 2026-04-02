import { Router, type Request, type Response } from "express";
import { db, sql } from "../../../db/src/index.js";
import { facultySubmissionsTable } from "../../../db/src/schema/faculty_submissions.js";
import { studentSubmissionsTable } from "../../../db/src/schema/student_submissions.js";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminStatsResponse,
} from "../../../api-zod/src/generated/api.js";

const router = Router();
const isMissingRelationError = (message: string) =>
  message.includes("relation") ||
  message.includes("does not exist") ||
  message.includes("faculty_submissions") ||
  message.includes("student_submissions");

const ADMIN_PASSWORDS = new Set(["admin123", "sns123"]);
const SOFT_DELETE_RETENTION_HOURS = 30;

function deletedCutoffDate() {
  return new Date(Date.now() - SOFT_DELETE_RETENTION_HOURS * 60 * 60 * 1000);
}

async function purgeExpiredDeletedRows() {
  const cutoff = deletedCutoffDate();
  await Promise.all([
    db
      .delete(facultySubmissionsTable)
      .where(sql`${facultySubmissionsTable.deletedAt} IS NOT NULL AND ${facultySubmissionsTable.deletedAt} < ${cutoff}`),
    db
      .delete(studentSubmissionsTable)
      .where(sql`${studentSubmissionsTable.deletedAt} IS NOT NULL AND ${studentSubmissionsTable.deletedAt} < ${cutoff}`),
  ]);
}

router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const envPass = process.env.ADMIN_PASSWORD;
  const isAuthorized = ADMIN_PASSWORDS.has(parsed.data.password) || (envPass && parsed.data.password === envPass);

  if (!isAuthorized) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.json(
    AdminLoginResponse.parse({
      token: parsed.data.password,
      message: "Login successful",
    })
  );
});

router.get("/admin/stats", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  const envPass = process.env.ADMIN_PASSWORD;
  
  const isAuthorized = ADMIN_PASSWORDS.has(token) || (envPass && token === envPass);

  if (!isAuthorized) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await purgeExpiredDeletedRows();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [facultyTotal] = await db
      .select({
        count: sql<number>`COALESCE(sum(
          COALESCE(jsonb_array_length(data->'papersPublished'), 0) +
          COALESCE(jsonb_array_length(data->'booksChapters'), 0) +
          COALESCE(jsonb_array_length(data->'patentsGranted'), 0) +
          COALESCE(jsonb_array_length(data->'phdAwardees'), 0)
        ), 0)::int`,
      })
      .from(facultySubmissionsTable)
      .where(sql`${facultySubmissionsTable.deletedAt} IS NULL`);

    const [studentTotal] = await db
      .select({
        count: sql<number>`COALESCE(sum(
          COALESCE(jsonb_array_length(data->'firstRankHolders'), 0) +
          COALESCE(jsonb_array_length(data->'semesterWiseRankers'), 0) +
          COALESCE(jsonb_array_length(data->'reputedInstitutionAchievements'), 0)
        ), 0)::int`,
      })
      .from(studentSubmissionsTable)
      .where(sql`${studentSubmissionsTable.deletedAt} IS NULL`);

    const [recentFaculty] = await db
      .select({
        count: sql<number>`COALESCE(sum(
          COALESCE(jsonb_array_length(data->'papersPublished'), 0) +
          COALESCE(jsonb_array_length(data->'booksChapters'), 0) +
          COALESCE(jsonb_array_length(data->'patentsGranted'), 0) +
          COALESCE(jsonb_array_length(data->'phdAwardees'), 0)
        ), 0)::int`,
      })
      .from(facultySubmissionsTable)
      .where(sql`${facultySubmissionsTable.deletedAt} IS NULL AND ${facultySubmissionsTable.createdAt} >= ${thirtyDaysAgo}`);

    const [recentStudent] = await db
      .select({
        count: sql<number>`COALESCE(sum(
          COALESCE(jsonb_array_length(data->'firstRankHolders'), 0) +
          COALESCE(jsonb_array_length(data->'semesterWiseRankers'), 0) +
          COALESCE(jsonb_array_length(data->'reputedInstitutionAchievements'), 0)
        ), 0)::int`,
      })
      .from(studentSubmissionsTable)
      .where(sql`${studentSubmissionsTable.deletedAt} IS NULL AND ${studentSubmissionsTable.createdAt} >= ${thirtyDaysAgo}`);

    res.json(
      GetAdminStatsResponse.parse({
        totalFacultySubmissions: facultyTotal?.count ?? 0,
        totalStudentSubmissions: studentTotal?.count ?? 0,
        recentFacultySubmissions: recentFaculty?.count ?? 0,
        recentStudentSubmissions: recentStudent?.count ?? 0,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database query failed";
    if (isMissingRelationError(message.toLowerCase())) {
      res.json(
        GetAdminStatsResponse.parse({
          totalFacultySubmissions: 0,
          totalStudentSubmissions: 0,
          recentFacultySubmissions: 0,
          recentStudentSubmissions: 0,
        })
      );
      return;
    }

    res.status(500).json({ error: message });
  }
});

export default router;
