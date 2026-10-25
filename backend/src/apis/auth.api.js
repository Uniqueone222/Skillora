import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();
router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/logout", controller.logout);
router.get("/me", authenticate, controller.me);

export default router;
