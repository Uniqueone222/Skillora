import { Router } from "express";
import * as controller from "../controllers/educator.controller.js";
import * as courseController from "../controllers/course.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { requireCapability } from "../middlewares/authorize.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema, slugParamSchema } from "../validators/query.validator.js";
import { updateProfileSchema } from "../validators/educator.validator.js";

const router = Router();
router.get("/me/courses", authenticate, requireCapability("educator"), courseController.myCourses);
router.patch("/me", authenticate, requireCapability("educator"), validate(updateProfileSchema), controller.updateProfile);
router.post("/activate", authenticate, controller.activate);
router.get("/:educatorId", validate(idParamSchema("educatorId")), controller.getPublicProfile);

export default router;
