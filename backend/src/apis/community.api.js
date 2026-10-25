import { Router } from "express";
import * as controller from "../controllers/community.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema, communityQuerySchema } from "../validators/query.validator.js";
import {
  answerSchema,
  communitySettingsSchema,
  discussionSchema,
  resolveSchema
} from "../validators/community.validator.js";

const router = Router();
router.use(authenticate);
router.get("/", validate(communityQuerySchema), controller.get);
router.patch("/:communityId/settings", validate(communitySettingsSchema), controller.updateSettings);
router.get("/:communityId/discussions", validate(idParamSchema("communityId")), controller.discussions);
router.post("/:communityId/discussions", validate(discussionSchema), controller.createDiscussion);
router.post("/discussions/:discussionId/answers", validate(answerSchema), controller.addAnswer);
router.patch("/discussions/:discussionId/resolve", validate(resolveSchema), controller.resolve);

export default router;
