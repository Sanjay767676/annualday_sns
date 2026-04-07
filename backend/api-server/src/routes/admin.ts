import { Router, type Request, type Response } from "express";
import { db, sql } from "../../../db/src/index.js";
import { facultySubmissionsTable } from "../../../db/src/schema/faculty_submissions.js";
import { studentSubmissionsTable } from "../../../db/src/schema/student_submissions.js";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminStatsResponse,
} from "../../../api-zod/src/generated/api.js";
import {
  getSiteConfig,
  isAdminTokenAuthorized,
  updateSiteConfig,
} from "../lib/site-config.js";

const router = Router();
const isMissingRelationError = (message: string) =>
  message.includes("relation") ||
  message.includes("faculty_submissions") ||
  message.includes("student_submissions");
const isMissingDeletedColumnError = (error: unknown) => {
  const errorStr = JSON.stringify(error).toLowerCase();
  return errorStr.includes("deleted_at") && 
    (errorStr.includes("does not exist") || 
     errorStr.includes("not found") || 
     errorStr.includes("unknown column") ||
     errorStr.includes("unknown field"));
};

const SOFT_DELETE_RETENTION_HOURS = 30;

function deletedCutoffDate() {
  return new Date(Date.now() - SOFT_DELETE_RETENTION_HOURS * 60 * 60 * 1000);
}

async function purgeExpiredDeletedRows() {
  const cutoff = deletedCutoffDate();
  try {
    await Promise.all([
      db
        .delete(facultySubmissionsTable)
        .where(sql`${facultySubmissionsTable.deletedAt} IS NOT NULL AND ${facultySubmissionsTable.deletedAt} < ${cutoff}`),
      db
        .delete(studentSubmissionsTable)
        .where(sql`${studentSubmissionsTable.deletedAt} IS NOT NULL AND ${studentSubmissionsTable.deletedAt} < ${cutoff}`),
    ]);
  } catch (error) {
    if (!isMissingDeletedColumnError(error)) {
      throw error;
    }
  }
}

router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const isAuthorized = await isAdminTokenAuthorized(parsed.data.password);

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

router.get("/site-config", async (_req: Request, res: Response): Promise<void> => {
  const config = await getSiteConfig();
  res.json({
    acceptingResponses: config.acceptingResponses,
    passwordInitialized: config.passwordInitialized,
    updatedAt: config.updatedAt,
  });
});

router.get("/admin/site-config", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;

  if (!(await isAdminTokenAuthorized(token))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const config = await getSiteConfig();
  res.json({
    acceptingResponses: config.acceptingResponses,
    passwordInitialized: config.passwordInitialized,
    updatedAt: config.updatedAt,
  });
});

router.patch("/admin/site-config", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;

  if (!(await isAdminTokenAuthorized(token))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const acceptingResponses =
    typeof req.body.acceptingResponses === "boolean" ? req.body.acceptingResponses : undefined;
  const adminPassword =
    typeof req.body.adminPassword === "string" ? req.body.adminPassword.trim() : undefined;

  if (acceptingResponses === undefined && !adminPassword) {
    res.status(400).json({ error: "No updates provided" });
    return;
  }

  if (adminPassword !== undefined && adminPassword.length === 0) {
    res.status(400).json({ error: "Admin password cannot be empty" });
    return;
  }

  const nextConfig = await updateSiteConfig({
    acceptingResponses,
    adminPassword,
    passwordInitialized: adminPassword ? true : undefined,
  });

  res.json({
    acceptingResponses: nextConfig.acceptingResponses,
    passwordInitialized: nextConfig.passwordInitialized,
    updatedAt: nextConfig.updatedAt,
  });
});

router.get("/admin/stats", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;

  if (!(await isAdminTokenAuthorized(token))) {
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
    const message = error instanceof Error ? error.message.toLowerCase() : "database query failed";

    if (isMissingDeletedColumnError(message)) {
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
        .from(facultySubmissionsTable);

      const [studentTotal] = await db
        .select({
          count: sql<number>`COALESCE(sum(
            COALESCE(jsonb_array_length(data->'firstRankHolders'), 0) +
            COALESCE(jsonb_array_length(data->'semesterWiseRankers'), 0) +
            COALESCE(jsonb_array_length(data->'reputedInstitutionAchievements'), 0)
          ), 0)::int`,
        })
        .from(studentSubmissionsTable);

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
        .where(sql`${facultySubmissionsTable.createdAt} >= ${thirtyDaysAgo}`);

      const [recentStudent] = await db
        .select({
          count: sql<number>`COALESCE(sum(
            COALESCE(jsonb_array_length(data->'firstRankHolders'), 0) +
            COALESCE(jsonb_array_length(data->'semesterWiseRankers'), 0) +
            COALESCE(jsonb_array_length(data->'reputedInstitutionAchievements'), 0)
          ), 0)::int`,
        })
        .from(studentSubmissionsTable)
        .where(sql`${studentSubmissionsTable.createdAt} >= ${thirtyDaysAgo}`);

      res.json(
        GetAdminStatsResponse.parse({
          totalFacultySubmissions: facultyTotal?.count ?? 0,
          totalStudentSubmissions: studentTotal?.count ?? 0,
          recentFacultySubmissions: recentFaculty?.count ?? 0,
          recentStudentSubmissions: recentStudent?.count ?? 0,
        }),
      );
      return;
    }

    if (isMissingRelationError(message)) {
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

    res.status(500).json({ error: error instanceof Error ? error.message : "Database query failed" });
  }
});

export default router;
