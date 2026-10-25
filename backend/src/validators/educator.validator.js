import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    headline: z.string().trim().max(120).optional(),
    biography: z.string().trim().max(3000).optional(),
    expertise: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    skills: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(50).optional(),
    messagingEnabled: z.boolean().optional()
  }).strict().refine((body) => Object.keys(body).length > 0)
});
