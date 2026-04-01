import { Router, type Request, type Response } from "express";
import { db, sql, gte } from "../../../db/src/index.js";
import { facultySubmissionsTable } from "../../../db/src/schema/faculty_submissions.js";
import { studentSubmissionsTable } from "../../../db/src/schema/student_submissions.js";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminStatsResponse,
} from "../../../api-zod/src/generated/api.js";

const router = Router();

const ADMIN_PASSWORDS = new Set(["admin123", "sns123"]);

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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [facultyTotal] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(facultySubmissionsTable);

  const [studentTotal] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studentSubmissionsTable);

  const [recentFaculty] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(facultySubmissionsTable)
    .where(gte(facultySubmissionsTable.createdAt, thirtyDaysAgo));

  const [recentStudent] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(studentSubmissionsTable)
    .where(gte(studentSubmissionsTable.createdAt, thirtyDaysAgo));

  res.json(
    GetAdminStatsResponse.parse({
      totalFacultySubmissions: facultyTotal?.count ?? 0,
      totalStudentSubmissions: studentTotal?.count ?? 0,
      recentFacultySubmissions: recentFaculty?.count ?? 0,
      recentStudentSubmissions: recentStudent?.count ?? 0,
    })
  );
});

export default router;
