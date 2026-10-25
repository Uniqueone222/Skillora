import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export const communitySettingsSchema = z.object({
  params: z.object({ communityId: objectId }),
  body: z.object({
    accessMode: z.enum(["public", "enrolled", "educator_responses_only", "disabled"])
  }).strict()
});

export const discussionSchema = z.object({
  params: z.object({ communityId: objectId }),
  body: z.object({
    type: z.enum(["question", "discussion", "resource"]).default("question"),
    title: z.string().trim().min(3).max(180),
    body: z.string().trim().min(1).max(10000)
  }).strict()
});

export const answerSchema = z.object({
  params: z.object({ discussionId: objectId }),
  body: z.object({ body: z.string().trim().min(1).max(5000) }).strict()
});

export const resolveSchema = z.object({
  params: z.object({ discussionId: objectId }),
  body: z.object({ answerId: objectId })
});
