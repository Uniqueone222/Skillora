import { Router } from "express";
import * as controller from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { requireRole } from "../middlewares/authorize.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { reviewCourseSchema } from "../validators/courses.validator.js";
import { reviewSkillRequestSchema } from "../validators/skills.validator.js";

const router = Router();
router.use(authenticate, requireRole("admin"));
router.get("/skill-requests", controller.skillRequests);
router.patch("/skill-requests/:requestId", validate(reviewSkillRequestSchema), controller.reviewSkillRequest);
router.get("/courses/pending", controller.pendingCourses);
router.patch("/courses/:courseId", validate(reviewCourseSchema), controller.reviewCourse);

export default router;
