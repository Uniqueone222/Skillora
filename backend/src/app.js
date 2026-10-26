import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import authApi from "./apis/auth.api.js";
import educatorApi from "./apis/educator.api.js";
import skillApi from "./apis/skill.api.js";
import courseApi from "./apis/course.api.js";
import enrollmentApi from "./apis/enrollment.api.js";
import paymentApi from "./apis/payment.api.js";
import adminApi from "./apis/admin.api.js";
import communityApi from "./apis/community.api.js";
import messagingApi from "./apis/messaging.api.js";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { notFound } from "./middlewares/notFound.middleware.js";

const app = express();
app.disable("x-powered-by");
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use("/api/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts; try again later" }
});
const messagingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false
});
app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok", environment: env.NODE_ENV } });
});
app.use("/api/auth", authLimiter, authApi);
app.use("/api/educators", educatorApi);
app.use("/api/skills", skillApi);
app.use("/api/courses", courseApi);
app.use("/api/enrollments", enrollmentApi);
app.use("/api/payments", paymentApi);
app.use("/api/admin", adminApi);
app.use("/api/communities", communityApi);
app.use("/api/conversations", messagingLimiter, messagingApi);
app.use(notFound);
app.use(errorHandler);

export default app;
