import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import * as controller from "../controllers/enrollment.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createOrderSchema, verifyPaymentSchema } from "../validators/payments.validator.js";

const router = Router();
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false
});
router.post("/order", checkoutLimiter, authenticate, validate(createOrderSchema), controller.createPaymentOrder);
router.post("/verify", checkoutLimiter, authenticate, validate(verifyPaymentSchema), controller.verifyPayment);
router.post("/webhook", controller.paymentWebhook);

export default router;
