import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as controller from "../controllers/skill.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  idParamSchema,
  skillCoursesQuerySchema,
  skillQuerySchema,
  slugParamSchema
} from "../validators/query.validator.js";
import { skillRequestSchema } from "../validators/skills.validator.js";

const router = Router();
const votingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false
});
router.get("/", validate(skillQuerySchema), controller.list);
router.get("/requests", controller.listRequests);
router.get("/:slug/courses", validate(skillCoursesQuerySchema), controller.courses);
router.get("/:slug", validate(slugParamSchema), controller.get);
router.post("/requests", votingLimiter, authenticate, validate(skillRequestSchema), controller.createRequest);
router.post("/requests/:requestId/vote", votingLimiter, authenticate, validate(idParamSchema("requestId")), controller.vote);
router.delete("/requests/:requestId/vote", votingLimiter, authenticate, validate(idParamSchema("requestId")), controller.removeVote);

export default router;
