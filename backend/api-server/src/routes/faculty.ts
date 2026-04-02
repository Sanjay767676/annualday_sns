import { Router, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { db, sql } from "../../../db/src/index.js";
import { facultySubmissionsTable } from "../../../db/src/schema/faculty_submissions.js";
import { SubmitFacultyFormBody } from "../../../api-zod/src/generated/api.js";

const router = Router();
const isMissingRelationError = (message: string) =>
  message.includes("relation") ||
  message.includes("faculty_submissions");
const isMissingDeletedColumnError = (error: unknown) => {
  const errorStr = JSON.stringify(error).toLowerCase();
  return errorStr.includes("deleted_at") && 
    (errorStr.includes("does not exist") || 
     errorStr.includes("not found") || 
     errorStr.includes("unknown column") ||
     errorStr.includes("unknown field"));
};
const isDeletedAtError = (error: unknown) => {
  const errorStr = JSON.stringify(error).toLowerCase();
  return errorStr.includes("deleted_at") && errorStr.includes("does not exist");
};

const FACULTY_SECTION_MAP: Record<string, string> = {
  paper: "papersPublished",
  book: "booksChapters",
  patent: "patentsGranted",
  phd: "phdAwardees",
};

const ADMIN_PASSWORDS = new Set(["admin123", "sns123"]);
const SOFT_DELETE_RETENTION_HOURS = 30;

function deletedCutoffDate() {
  return new Date(Date.now() - SOFT_DELETE_RETENTION_HOURS * 60 * 60 * 1000);
}

async function purgeOldDeletedFacultySubmissions() {
  try {
    await db
      .delete(facultySubmissionsTable)
      .where(sql`${facultySubmissionsTable.deletedAt} IS NOT NULL AND ${facultySubmissionsTable.deletedAt} < ${deletedCutoffDate()}`);
  } catch (error) {
    if (!isMissingDeletedColumnError(error)) {
      throw error;
    }
  }
}

router.post("/faculty", async (req: Request, res: Response): Promise<void> => {
  const parsed = SubmitFacultyFormBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [submission] = await db
      .insert(facultySubmissionsTable)
      .values({ id: randomUUID(), data: parsed.data })
      .returning();

    res.status(201).json({
      id: submission.id,
      message: "Faculty form submitted successfully",
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to insert faculty submission");
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
               jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
      WHERE fs.deleted_at IS NULL AND cast(elem AS text) ILIKE ${"%" + search + "%"}
          ORDER BY fs.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`
    : sql`SELECT elem, fs.id AS submission_id, fs.created_at AS submitted_at
          FROM faculty_submissions fs,
               jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
      WHERE fs.deleted_at IS NULL
          ORDER BY fs.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`;

  const countQuery = search
    ? sql`SELECT count(*) AS count
          FROM faculty_submissions fs,
               jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
      WHERE fs.deleted_at IS NULL AND cast(elem AS text) ILIKE ${"%" + search + "%"}`
    : sql`SELECT count(*) AS count
          FROM faculty_submissions fs,
        jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
      WHERE fs.deleted_at IS NULL`;

        const legacyRowsQuery = search
          ? sql`SELECT elem, fs.id AS submission_id, fs.created_at AS submitted_at
          FROM faculty_submissions fs,
            jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
          WHERE cast(elem AS text) ILIKE ${"%" + search + "%"}
          ORDER BY fs.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`
          : sql`SELECT elem, fs.id AS submission_id, fs.created_at AS submitted_at
          FROM faculty_submissions fs,
            jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
          ORDER BY fs.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`;

        const legacyCountQuery = search
          ? sql`SELECT count(*) AS count
          FROM faculty_submissions fs,
            jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
          WHERE cast(elem AS text) ILIKE ${"%" + search + "%"}`
          : sql`SELECT count(*) AS count
          FROM faculty_submissions fs,
            jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem`;

  try {
    try {
      await purgeOldDeletedFacultySubmissions();
    } catch (purgeError) {
      req.log.error({ err: purgeError }, "Purge error (non-fatal)");
    }

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
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "database query failed";

    if (isMissingDeletedColumnError(error)) {
       try {
         const [rowsResult, countQueryResult] = await Promise.all([
        db.execute(legacyRowsQuery),
        db.execute(legacyCountQuery),
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
         return;
       } catch (legacyError) {
         req.log.error({ err: legacyError }, "Legacy query also failed");
         res.json({ data: [], total: 0, page, limit });
         return;
       }
    }

    if (isMissingRelationError(message)) {
      res.json({ data: [], total: 0, page, limit });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : "Database query failed" });
  }
});

router.delete("/admin/faculty/:submissionId", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  const envPass = process.env.ADMIN_PASSWORD;

  const isAuthorized = ADMIN_PASSWORDS.has(token) || (envPass && token === envPass);
  if (!isAuthorized) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const submissionId = req.params.submissionId;
  if (!submissionId) {
    res.status(400).json({ error: "Submission id is required" });
    return;
  }

  try {
    await purgeOldDeletedFacultySubmissions();

    const deleted = await db
      .update(facultySubmissionsTable)
      .set({ deletedAt: new Date() })
      .where(sql`${facultySubmissionsTable.id} = ${submissionId}`)
      .returning({ id: facultySubmissionsTable.id });

    if (!deleted.length) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    res.json({ message: "Faculty submission moved to deleted", id: deleted[0].id });
  } catch (error) {
    req.log.error({ err: error }, "Failed to delete faculty submission");
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (isMissingDeletedColumnError(message)) {
      const deleted = await db
        .delete(facultySubmissionsTable)
        .where(sql`${facultySubmissionsTable.id} = ${submissionId}`)
        .returning({ id: facultySubmissionsTable.id });

      if (!deleted.length) {
        res.status(404).json({ error: "Submission not found" });
        return;
      }

      res.json({ message: "Faculty submission deleted", id: deleted[0].id });
      return;
    }

    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

router.get("/admin/faculty/deleted", async (req: Request, res: Response): Promise<void> => {
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
  const sectionSql = sql.raw(`'${section}'`);

  const rowsQuery = search
    ? sql`SELECT elem, fs.id AS submission_id, fs.created_at AS submitted_at, fs.deleted_at AS deleted_at
          FROM faculty_submissions fs,
               jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
          WHERE fs.deleted_at IS NOT NULL AND cast(elem AS text) ILIKE ${"%" + search + "%"}
          ORDER BY fs.deleted_at DESC
          LIMIT ${limit} OFFSET ${offset}`
    : sql`SELECT elem, fs.id AS submission_id, fs.created_at AS submitted_at, fs.deleted_at AS deleted_at
          FROM faculty_submissions fs,
               jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
          WHERE fs.deleted_at IS NOT NULL
          ORDER BY fs.deleted_at DESC
          LIMIT ${limit} OFFSET ${offset}`;

  const countQuery = search
    ? sql`SELECT count(*) AS count
          FROM faculty_submissions fs,
               jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
          WHERE fs.deleted_at IS NOT NULL AND cast(elem AS text) ILIKE ${"%" + search + "%"}`
    : sql`SELECT count(*) AS count
          FROM faculty_submissions fs,
               jsonb_array_elements(COALESCE(fs.data->${sectionSql}, '[]'::jsonb)) AS elem
          WHERE fs.deleted_at IS NOT NULL`;

  try {
    try {
      await purgeOldDeletedFacultySubmissions();
    } catch (purgeError) {
      req.log.error({ err: purgeError }, "Purge error (non-fatal)");
    }

    const [rowsResult, countQueryResult] = await Promise.all([db.execute(rowsQuery), db.execute(countQuery)]);
    const rows = (rowsResult as unknown as { rows: Array<{ elem: Record<string, unknown>; submission_id: string; submitted_at: Date; deleted_at: Date }> }).rows
      ?? (rowsResult as unknown as Array<{ elem: Record<string, unknown>; submission_id: string; submitted_at: Date; deleted_at: Date }>);
    const countRows = (countQueryResult as unknown as { rows: Array<{ count: string }> }).rows
      ?? (countQueryResult as unknown as Array<{ count: string }>);

    const total = parseInt(countRows[0]?.count ?? "0", 10);
    const data = rows.map((r) => ({
      ...(r.elem as Record<string, unknown>),
      _submissionId: r.submission_id,
      _submittedAt: r.submitted_at,
      _deletedAt: r.deleted_at,
    }));

    res.json({ data, total, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "database query failed";
    if (isMissingDeletedColumnError(message) || isMissingRelationError(message)) {
      res.json({ data: [], total: 0, page, limit });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : "Database query failed" });
  }
});

router.post("/admin/faculty/:submissionId/restore", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers["x-admin-token"] as string;
  const envPass = process.env.ADMIN_PASSWORD;
  const isAuthorized = ADMIN_PASSWORDS.has(token) || (envPass && token === envPass);

  if (!isAuthorized) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const submissionId = req.params.submissionId;
  if (!submissionId) {
    res.status(400).json({ error: "Submission id is required" });
    return;
  }

  try {
    await purgeOldDeletedFacultySubmissions();
    const restored = await db
      .update(facultySubmissionsTable)
      .set({ deletedAt: null })
      .where(sql`${facultySubmissionsTable.id} = ${submissionId}`)
      .returning({ id: facultySubmissionsTable.id });

    if (!restored.length) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    res.json({ message: "Faculty submission restored", id: restored[0].id });
  } catch (error) {
    req.log.error({ err: error }, "Failed to restore faculty submission");
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (isMissingDeletedColumnError(message)) {
      res.status(400).json({ error: "Restore is unavailable until deleted_at column is added" });
      return;
    }
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

export default router;

