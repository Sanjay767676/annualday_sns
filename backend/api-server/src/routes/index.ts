import { Router } from "express";
import healthRouter from "./health.js";
import facultyRouter from "./faculty.js";
import studentRouter from "./student.js";
import adminRouter from "./admin.js";

const router = Router();

router.use(healthRouter);
router.use(facultyRouter);
router.use(studentRouter);
router.use(adminRouter);

export default router;
