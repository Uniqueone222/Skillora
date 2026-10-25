import { Router } from "express";
import * as controller from "../controllers/messaging.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { idParamSchema } from "../validators/query.validator.js";
import { messageSchema, startConversationSchema } from "../validators/payments.validator.js";

const router = Router();
router.use(authenticate);
router.get("/", controller.list);
router.post("/", validate(startConversationSchema), controller.start);
router.get("/:conversationId/messages", validate(idParamSchema("conversationId")), controller.messages);
router.post("/:conversationId/messages", validate(messageSchema), controller.send);

export default router;
