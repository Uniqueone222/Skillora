import { Router } from "express";
import * as controller from "../controllers/enrollment.controller.js";
import { authenticate } from "../middlewares/authenticate.middleware.js";

const router = Router();
router.use(authenticate);
router.get("/my", controller.mine);

export default router;
