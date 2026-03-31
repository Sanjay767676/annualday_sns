import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { facultySubmissionsTable, studentSubmissionsTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminStatsResponse,
} from "@workspace/api-zod";
import { gte, sql } from "drizzle-orm";

const router = Router();

router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  if (parsed.data.password !== adminPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.json(
    AdminLoginResponse.parse({
      token: adminPassword,
      message: "Login successful",
    })
  );
});

router.get("/admin/stats", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-admin-token"];
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  if (token !== adminPassword) {
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
