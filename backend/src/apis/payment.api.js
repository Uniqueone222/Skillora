import { Router } from "express";
import * as controller from "../controllers/enrollment.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createOrderSchema, verifyPaymentSchema } from "../validators/payments.validator.js";

const router = Router();
router.post("/order", authenticate, validate(createOrderSchema), controller.createPaymentOrder);
router.post("/verify", authenticate, validate(verifyPaymentSchema), controller.verifyPayment);
router.post("/webhook", controller.paymentWebhook);

export default router;
