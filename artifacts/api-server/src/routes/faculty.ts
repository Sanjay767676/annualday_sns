import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, facultySubmissionsTable } from "@workspace/db";
import {
  SubmitFacultyFormBody,
  GetAllFacultySubmissionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

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

  const submissions = await db
    .select()
    .from(facultySubmissionsTable)
    .orderBy(desc(facultySubmissionsTable.createdAt));

  res.json(
    GetAllFacultySubmissionsResponse.parse(
      submissions.map((s) => ({
        id: s.id,
        data: s.data,
        createdAt: s.createdAt,
      }))
    )
  );
});

export default router;
