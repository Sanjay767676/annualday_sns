import { Router, type Request, type Response } from "express";
import { db, sql } from "../../../db/src/index.js";
import { facultySubmissionsTable } from "../../../db/src/schema/faculty_submissions.js";
import { SubmitFacultyFormBody } from "../../../api-zod/src/generated/api.js";

const router = Router();

const FACULTY_SECTION_MAP: Record<string, string> = {
  paper: "papersPublished",
  book: "booksChapters",
  patent: "patentsGranted",
  phd: "phdAwardees",
};

const ADMIN_PASSWORDS = new Set(["admin123", "sns123"]);

router.post("/faculty", async (req: Request, res: Response): Promise<void> => {
  const parsed = SubmitFacultyFormBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [submission] = await db
      .insert(facultySubmissionsTable)
      .values({ data: parsed.data })
      .returning();

    res.status(201).json({
      id: submission.id,
      message: "Faculty form submitted successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: message });
  }
});

router.get("/admin/faculty", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  const envPass = process.env.ADMIN_PASSWORD;

  const isAuthorized = ADMIN_PASSWORDS.has(token) || (envPass && token === envPass);

  if (!isAuthorized) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const typeRaw = (req.query.type as string) || "paper";
  const section = FACULTY_SECTION_MAP[typeRaw] ?? "papersPublished";
  const search = ((req.query.search as string) || "").trim();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const offset = (page - 1) * limit;

  type RowResult = { elem: Record<string, unknown>; submission_id: string; submitted_at: Date };
  type CountResult = { count: string };

  const sectionSql = sql.raw(`'${section}'`);

  const rowsQuery = search
    ? sql`SELECT elem, fs.id AS submission_id, fs.created_at AS submitted_at
          FROM faculty_submissions fs,
               jsonb_array_elements(fs.data->${sectionSql}) AS elem
          WHERE cast(elem AS text) ILIKE ${"%" + search + "%"}
          ORDER BY fs.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`
    : sql`SELECT elem, fs.id AS submission_id, fs.created_at AS submitted_at
          FROM faculty_submissions fs,
               jsonb_array_elements(fs.data->${sectionSql}) AS elem
          ORDER BY fs.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`;

  const countQuery = search
    ? sql`SELECT count(*) AS count
          FROM faculty_submissions fs,
               jsonb_array_elements(fs.data->${sectionSql}) AS elem
          WHERE cast(elem AS text) ILIKE ${"%" + search + "%"}`
    : sql`SELECT count(*) AS count
          FROM faculty_submissions fs,
               jsonb_array_elements(fs.data->${sectionSql}) AS elem`;

  const [rowsResult, countQueryResult] = await Promise.all([
    db.execute(rowsQuery),
    db.execute(countQuery),
  ]);

  const rows = (rowsResult as unknown as { rows: RowResult[] }).rows ?? (rowsResult as unknown as RowResult[]);
  const countRows = (countQueryResult as unknown as { rows: CountResult[] }).rows ?? (countQueryResult as unknown as CountResult[]);

  const total = parseInt(countRows[0]?.count ?? "0", 10);
  const data = rows.map((r) => ({
    ...(r.elem as Record<string, unknown>),
    _submissionId: r.submission_id,
    _submittedAt: r.submitted_at,
  }));

  res.json({ data, total, page, limit });
});

export default router;
