import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, studentSubmissionsTable } from "@workspace/db";
import {
  SubmitStudentFormBody,
  GetAllStudentSubmissionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/student", async (req, res): Promise<void> => {
  const parsed = SubmitStudentFormBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [submission] = await db
    .insert(studentSubmissionsTable)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      customField: parsed.data.customField,
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

  const submissions = await db
    .select()
    .from(studentSubmissionsTable)
    .orderBy(desc(studentSubmissionsTable.createdAt));

  res.json(
    GetAllStudentSubmissionsResponse.parse(
      submissions.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        customField: s.customField,
        createdAt: s.createdAt,
      }))
    )
  );
});

export default router;
