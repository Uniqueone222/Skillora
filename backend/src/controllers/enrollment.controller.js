import * as enrollmentService from "../services/enrollment.service.js";
import * as paymentService from "../services/payment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const mine = asyncHandler(async (req, res) => {
  const enrollments = await enrollmentService.listMine(req.user._id);
  res.json({ success: true, data: { enrollments } });
});

export const status = asyncHandler(async (req, res) => {
  const enrolled = await enrollmentService.hasEnrollment(
    req.user._id,
    req.validated.params.courseId
  );
  res.json({ success: true, data: { enrolled } });
});

export const enrollFree = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentService.createFreeEnrollment(
    req.user._id, req.validated.params.courseId
  );
  res.status(201).json({ success: true, data: { enrollment } });
});

export const progress = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentService.updateProgress(
    req.user._id,
    req.validated.params.courseId,
    req.validated.body
  );
  res.json({ success: true, data: { enrollment } });
});

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const order = await paymentService.createCourseOrder(req.user._id, req.validated.body.courseId);
  res.status(201).json({ success: true, data: { order } });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
    req.validated.body;
  const result = await paymentService.verifyCoursePayment(req.user._id, { orderId, paymentId, signature });
  res.json({ success: true, data: result });
});

export const paymentWebhook = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyWebhook(req.body, req.get("x-razorpay-signature"));
  res.json({ success: true, data: result });
});
