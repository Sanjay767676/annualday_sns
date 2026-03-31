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

  const { name, email, customField, semesterToppers, remarkableAchievements } = parsed.data;

  const [submission] = await db
    .insert(studentSubmissionsTable)
    .values({
      name,
      email,
      customField,
      data: { semesterToppers, remarkableAchievements },
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

  const data = submissions.map((s) => {
    const d = (s.data as any) ?? {};
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      customField: s.customField,
      semesterToppers: d.semesterToppers ?? [],
      remarkableAchievements: d.remarkableAchievements ?? [],
      createdAt: s.createdAt,
    };
  });

  res.json(GetAllStudentSubmissionsResponse.parse(data));
});

export default router;
