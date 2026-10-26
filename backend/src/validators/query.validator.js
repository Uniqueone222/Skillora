import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export const skillQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().max(80).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
});

export const courseQuerySchema = z.object({
  query: z.object({
    skillId: objectId.optional(),
    educatorId: objectId.optional(),
    category: z.string().trim().min(1).max(80).optional(),
    search: z.string().trim().max(160).optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    price: z.enum(["free", "paid"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
});

export const communityQuerySchema = z.object({
  query: z.object({
    scope: z.enum(["course", "educator"]),
    courseId: objectId.optional(),
    educatorId: objectId.optional()
  }).refine((query) => query.scope === "course" ? Boolean(query.courseId) : Boolean(query.educatorId))
});

export const idParamSchema = (key) => z.object({
  params: z.object({ [key]: objectId })
});

export const slugParamSchema = z.object({
  params: z.object({ slug: z.string().trim().min(1).max(120) })
});

export const skillCoursesQuerySchema = z.object({
  params: z.object({ slug: z.string().trim().min(1).max(120) }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
});
