import { Router } from "express";
import * as controller from "../controllers/course.controller.js";
import * as enrollmentController from "../controllers/enrollment.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema, courseQuerySchema } from "../validators/query.validator.js";
import {
  createCourseSchema,
  updateCourseSchema,
  moduleSchema,
  lessonSchema,
  updateModuleSchema
} from "../validators/courses.validator.js";
import { progressSchema } from "../validators/payments.validator.js";
import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const updateLessonSchema = z.object({
  params: z.object({ courseId: objectId, moduleId: objectId, lessonId: objectId }),
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    videoAssetId: z.string().trim().max(300).optional(),
    durationSeconds: z.number().int().min(0).optional(),
    isPreview: z.boolean().optional(),
    resources: z.array(z.object({
      title: z.string().trim().max(160),
      url: z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol))
    }).strict()).max(20).optional()
  }).strict().refine((body) => Object.keys(body).length > 0)
});

const router = Router();
router.get("/", validate(courseQuerySchema), controller.list);
router.get("/mine", authenticate, requireCapability("educator"), controller.myCourses);
router.post("/", authenticate, requireCapability("educator"), validate(createCourseSchema), controller.create);
router.post("/:courseId/enroll", authenticate, validate(idParamSchema("courseId")), enrollmentController.enrollFree);
router.get("/:courseId/learning-content", authenticate, validate(idParamSchema("courseId")), controller.learningContent);
router.patch("/:courseId/progress", authenticate, validate(progressSchema), enrollmentController.progress);
router.post("/:courseId/submit", authenticate, requireCapability("educator"), validate(idParamSchema("courseId")), controller.submit);
router.post("/:courseId/modules", authenticate, requireCapability("educator"), validate(moduleSchema), controller.addModule);
router.patch("/:courseId/modules/:moduleId", authenticate, requireCapability("educator"), validate(updateModuleSchema), controller.updateModule);
router.post("/:courseId/modules/:moduleId/lessons", authenticate, requireCapability("educator"), validate(lessonSchema), controller.addLesson);
router.patch("/:courseId/modules/:moduleId/lessons/:lessonId", authenticate, requireCapability("educator"), validate(updateLessonSchema), controller.updateLesson);
router.patch("/:courseId", authenticate, requireCapability("educator"), validate(updateCourseSchema), controller.update);
router.get("/:courseId", validate(idParamSchema("courseId")), controller.get);

export default router;
