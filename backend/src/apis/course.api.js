import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as controller from "../controllers/course.controller.js";
import * as enrollmentController from "../controllers/enrollment.controller.js";
import { authenticate, optionalAuthenticate } from "../middlewares/authenticate.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema, courseQuerySchema } from "../validators/query.validator.js";
import {
  createCourseSchema,
  updateCourseSchema,
  courseReviewParamsSchema,
  courseReviewSchema,
  moduleSchema,
  lessonSchema,
  updateModuleSchema,
  updateLessonSchema,
  lessonVideoUploadSchema,
  completeLessonVideoUploadSchema,
  lessonVideoSchema
} from "../validators/courses.validator.js";
import { progressSchema } from "../validators/payments.validator.js";

const router = Router();
const videoUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: { success: false, message: "Too many video upload authorizations; try again later" }
});
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: { success: false, message: "Too many review submissions; try again later" }
});

router.get("/", validate(courseQuerySchema), controller.list);
router.get("/mine", authenticate, requireCapability("educator"), controller.myCourses);
router.get("/:courseId/reviews", optionalAuthenticate, validate(courseReviewParamsSchema), controller.listReviews);
router.post("/:courseId/reviews", authenticate, reviewLimiter, validate(courseReviewSchema), controller.createReview);
router.put("/:courseId/reviews", authenticate, reviewLimiter, validate(courseReviewSchema), controller.updateReview);
router.get("/:courseId/enrollment", authenticate, validate(idParamSchema("courseId")), enrollmentController.status);
router.post("/", authenticate, requireCapability("educator"), validate(createCourseSchema), controller.create);
router.post("/:courseId/enroll", authenticate, validate(idParamSchema("courseId")), enrollmentController.enrollFree);
router.get("/:courseId/learning-content", authenticate, validate(idParamSchema("courseId")), controller.learningContent);
router.patch("/:courseId/progress", authenticate, validate(progressSchema), enrollmentController.progress);
router.post("/:courseId/submit", authenticate, requireCapability("educator"), validate(idParamSchema("courseId")), controller.submit);
router.post("/:courseId/modules", authenticate, requireCapability("educator"), validate(moduleSchema), controller.addModule);
router.patch("/:courseId/modules/:moduleId", authenticate, requireCapability("educator"), validate(updateModuleSchema), controller.updateModule);
router.post("/:courseId/modules/:moduleId/lessons", authenticate, requireCapability("educator"), validate(lessonSchema), controller.addLesson);
router.patch("/:courseId/modules/:moduleId/lessons/:lessonId", authenticate, requireCapability("educator"), validate(updateLessonSchema), controller.updateLesson);
router.post("/:courseId/modules/:moduleId/lessons/:lessonId/video-upload", authenticate, requireCapability("educator"), videoUploadLimiter, validate(lessonVideoUploadSchema), controller.createVideoUpload);
router.post("/:courseId/modules/:moduleId/lessons/:lessonId/video", authenticate, requireCapability("educator"), validate(completeLessonVideoUploadSchema), controller.completeVideoUpload);
router.get("/:courseId/modules/:moduleId/lessons/:lessonId/video", authenticate, validate(lessonVideoSchema), controller.lessonVideo);
router.patch("/:courseId", authenticate, requireCapability("educator"), validate(updateCourseSchema), controller.update);
router.get("/:courseId", validate(idParamSchema("courseId")), controller.get);

export default router;
