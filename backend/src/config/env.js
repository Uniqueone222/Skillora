import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must contain at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
  ADMIN_EMAILS: z.string().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().trim().default(""),
  CLOUDINARY_API_KEY: z.string().trim().default(""),
  CLOUDINARY_API_SECRET: z.string().trim().default(""),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default("")
}).superRefine((config, context) => {
  const cloudinaryValues = [
    config.CLOUDINARY_CLOUD_NAME,
    config.CLOUDINARY_API_KEY,
    config.CLOUDINARY_API_SECRET
  ];
  if (cloudinaryValues.some(Boolean) && !cloudinaryValues.every(Boolean)) {
    context.addIssue({
      code: "custom",
      message: "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured together"
    });
  }
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = Object.freeze(result.data);
export const adminEmails = new Set(
  env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)
);
