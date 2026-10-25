import { z } from "zod";

export const skillRequestSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).default("")
  }).strict()
});

export const reviewSkillRequestSchema = z.object({
  params: z.object({ requestId: z.string().regex(/^[a-f\d]{24}$/i) }),
  body: z.object({
    status: z.enum(["approved", "rejected"]),
    category: z.string().trim().min(1).max(80).default("Other"),
    description: z.string().trim().max(1000).optional()
  }).strict()
});
