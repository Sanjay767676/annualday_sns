import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, studentSubmissionsTable } from "@workspace/db";
import { SubmitStudentFormBody } from "@workspace/api-zod";

const router: IRouter = Router();

const STUDENT_SECTION_MAP: Record<string, string> = {
  firstRank: "firstRankHolders",
  semesterWise: "semesterWiseRankers",
  achievement: "remarkableAchievements",
};

router.post("/student", async (req, res): Promise<void> => {
  const parsed = SubmitStudentFormBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { firstRankHolders, semesterWiseRankers, remarkableAchievements } = parsed.data;

  const [submission] = await db
    .insert(studentSubmissionsTable)
    .values({
      data: { firstRankHolders, semesterWiseRankers, remarkableAchievements },
    })
    .returning();

  res.status(201).json({
    id: submission.id,
    message: "Student form submitted successfully",
  });
});

router.get("/admin/student", async (req, res): Promise<void> => {
  const token = req.headers["x-admin-token"];
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  if (token !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const type = (req.query.type as string) || "firstRank";
  const search = ((req.query.search as string) || "").trim();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const section = STUDENT_SECTION_MAP[type] || "firstRankHolders";

  const submissions = search
    ? await db
        .select()
        .from(studentSubmissionsTable)
        .where(sql`cast(${studentSubmissionsTable.data} as text) ILIKE ${"%" + search + "%"}`)
        .orderBy(desc(studentSubmissionsTable.createdAt))
    : await db
        .select()
        .from(studentSubmissionsTable)
        .orderBy(desc(studentSubmissionsTable.createdAt));

  const allRows: Record<string, unknown>[] = submissions.flatMap((s) => {
    const d = s.data as Record<string, unknown>;
    const items = (d[section] as Record<string, unknown>[]) ?? [];
    return items.map((item) => ({
      ...item,
      _submissionId: s.id,
      _submittedAt: s.createdAt,
    }));
  });

  const total = allRows.length;
  const offset = (page - 1) * limit;
  const data = allRows.slice(offset, offset + limit);

  res.json({ data, total, page, limit });
});

export default router;
