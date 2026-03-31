import { Router, type IRouter } from "express";
import healthRouter from "./health";
import facultyRouter from "./faculty";
import studentRouter from "./student";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(facultyRouter);
router.use(studentRouter);
router.use(adminRouter);

export default router;
