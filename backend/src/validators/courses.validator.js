import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const httpUrl = z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol));

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(5000),
    skillId: objectId,
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    pricePaise: z.number().int().min(0).max(100000000),
    thumbnailUrl: httpUrl.optional().or(z.literal(""))
  }).strict()
});

export const updateCourseSchema = z.object({
  params: z.object({ courseId: objectId }),
  body: z.object({
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    skillId: objectId.optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    pricePaise: z.number().int().min(0).max(100000000).optional(),
    thumbnailUrl: httpUrl.optional().or(z.literal(""))
  }).strict().refine((body) => Object.keys(body).length > 0, "At least one field is required")
});

export const moduleSchema = z.object({
  params: z.object({ courseId: objectId }),
  body: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1000).default("")
  }).strict()
});

export const lessonSchema = z.object({
  params: z.object({ courseId: objectId, moduleId: objectId }),
  body: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).default(""),
    isPreview: z.boolean().default(false),
    resources: z.array(z.object({ title: z.string().trim().max(160), url: httpUrl }).strict()).max(20).default([])
  }).strict()
});

const lessonVideoParams = z.object({
  courseId: objectId,
  moduleId: objectId,
  lessonId: objectId
});

export const updateLessonSchema = z.object({
  params: lessonVideoParams,
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(2000).optional(),
    isPreview: z.boolean().optional(),
    resources: z.array(z.object({ title: z.string().trim().max(160), url: httpUrl }).strict()).max(20).optional()
  }).strict().refine((body) => Object.keys(body).length > 0)
});

export const lessonVideoUploadSchema = z.object({
  params: lessonVideoParams
});

export const completeLessonVideoUploadSchema = z.object({
  params: lessonVideoParams,
  body: z.object({
    uploadTicket: z.string().min(1).max(4096),
    assetId: z.string().trim().min(1).max(100)
  }).strict()
});

export const lessonVideoSchema = z.object({
  params: lessonVideoParams
});

export const updateModuleSchema = z.object({
  params: z.object({ courseId: objectId, moduleId: objectId }),
  body: z.object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(1000).optional()
  }).strict().refine((body) => Object.keys(body).length > 0)
});

export const reviewCourseSchema = z.object({
  params: z.object({ courseId: objectId }),
  body: z.object({
    status: z.enum(["published", "rejected", "suspended"]),
    rejectionReason: z.string().trim().max(1000).optional()
  }).strict()
});
