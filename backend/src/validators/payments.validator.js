import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export const createOrderSchema = z.object({
  body: z.object({ courseId: objectId }).strict()
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string().min(1).max(100),
    razorpay_payment_id: z.string().min(1).max(100),
    razorpay_signature: z.string().regex(/^[a-f\d]{64}$/i)
  }).strict()
});

export const progressSchema = z.object({
  params: z.object({ courseId: objectId }),
  body: z.object({
    lessonId: objectId,
    completed: z.boolean()
  }).strict()
});

export const messageSchema = z.object({
  params: z.object({ conversationId: objectId }),
  body: z.object({ body: z.string().trim().min(1).max(5000) }).strict()
});

export const startConversationSchema = z.object({
  body: z.object({ educatorId: objectId }).strict()
});
