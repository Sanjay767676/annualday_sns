import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, facultySubmissionsTable } from "@workspace/db";
import { SubmitFacultyFormBody } from "@workspace/api-zod";

const router: IRouter = Router();

const FACULTY_SECTION_MAP: Record<string, string> = {
  paper: "papersPublished",
  book: "booksChapters",
  patent: "patentsGranted",
  phd: "phdAwardees",
};

router.post("/faculty", async (req, res): Promise<void> => {
  const parsed = SubmitFacultyFormBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [submission] = await db
    .insert(facultySubmissionsTable)
    .values({ data: parsed.data })
    .returning();

  res.status(201).json({
    id: submission.id,
    message: "Faculty form submitted successfully",
  });
});

router.get("/admin/faculty", async (req, res): Promise<void> => {
  const token = req.headers["x-admin-token"];
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

  if (token !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const type = (req.query.type as string) || "paper";
  const search = ((req.query.search as string) || "").trim();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const section = FACULTY_SECTION_MAP[type] || "papersPublished";

  const submissions = search
    ? await db
        .select()
        .from(facultySubmissionsTable)
        .where(sql`cast(${facultySubmissionsTable.data} as text) ILIKE ${"%" + search + "%"}`)
        .orderBy(desc(facultySubmissionsTable.createdAt))
    : await db
        .select()
        .from(facultySubmissionsTable)
        .orderBy(desc(facultySubmissionsTable.createdAt));

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
