import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(12).max(128)
  }).strict()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(1).max(128)
  }).strict()
});
