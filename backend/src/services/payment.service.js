import Razorpay from "razorpay";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Transaction from "../models/transaction.model.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyHmac } from "../utils/verifyHmac.js";

function getRazorpay() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, "Razorpay is not configured; set test-mode credentials to accept purchases");
  }
  if (!env.RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
    throw new ApiError(503, "Only Razorpay test-mode credentials are accepted by this application");
  }
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

export async function createCourseOrder(userId, courseId) {
  const course = await Course.findOne({ _id: courseId, status: "published" });
  if (!course) throw new ApiError(404, "Published course not found");
  const existing = await Enrollment.findOne({ learnerId: userId, courseId });
  if (existing) throw new ApiError(409, "You already have access to this course");
  if (course.pricePaise === 0) {
    throw new ApiError(400, "This course is free; use the free enrollment endpoint");
  }

  const razorpay = getRazorpay();
  const transaction = await Transaction.create({
    payerId: userId,
    educatorId: course.educatorId,
    courseId: course._id,
    grossAmountPaise: course.pricePaise,
    platformFeePaise: 0,
    educatorAmountPaise: course.pricePaise,
    currency: "INR",
    provider: "razorpay",
    status: "pending"
  });
  let order;
  try {
    order = await razorpay.orders.create({
      amount: course.pricePaise,
      currency: "INR",
      receipt: transaction._id.toString(),
      notes: { transactionId: transaction._id.toString(), courseId: course._id.toString() }
    });
  } catch (error) {
    transaction.status = "failed";
    await transaction.save();
    console.error("Razorpay order creation failed", {
      statusCode: error.statusCode,
      code: error.error?.code ?? error.code
    });
    throw new ApiError(502, "Razorpay could not create the payment order; please try again");
  }

  transaction.providerOrderId = order.id;
  await transaction.save();
  return {
    keyId: env.RAZORPAY_KEY_ID,
    orderId: order.id,
    amount: course.pricePaise,
    currency: "INR",
    transactionId: transaction._id
  };
}

export async function verifyCoursePayment(userId, { orderId, paymentId, signature }) {
  const transaction = await Transaction.findOne({ providerOrderId: orderId, payerId: userId });
  if (!transaction) throw new ApiError(404, "Pending purchase not found");
  if (!verifyHmac(`${orderId}|${paymentId}`, signature, env.RAZORPAY_KEY_SECRET)) {
    throw new ApiError(400, "Payment signature is invalid");
  }
  const payment = await captureIfAuthorizedPayment(getRazorpay(), paymentId, {
    orderId,
    amount: transaction.grossAmountPaise,
    currency: transaction.currency
  });
  if (transaction.providerPaymentId && transaction.providerPaymentId !== paymentId) {
    throw new ApiError(409, "A different payment is already linked to this purchase");
  }
  transaction.providerPaymentId ??= paymentId;
  transaction.status = "paid";
  transaction.paidAt ??= new Date();
  await transaction.save();
  return fulfill(transaction);
}

export async function captureIfAuthorizedPayment(razorpay, paymentId, expected) {
  let payment;
  try {
    payment = await razorpay.payments.fetch(paymentId);
  } catch (error) {
    logProviderFailure("Razorpay payment verification request failed", error);
    throw new ApiError(502, "Razorpay could not verify this payment; please try again");
  }

  if (payment.order_id !== expected.orderId
      || payment.amount !== expected.amount
      || payment.currency !== expected.currency) {
    throw new ApiError(409, "Payment does not match the expected order and amount");
  }

  if (payment.status === "authorized") {
    try {
      payment = await razorpay.payments.capture(paymentId, expected.amount, expected.currency);
    } catch (error) {
      try {
        payment = await razorpay.payments.fetch(paymentId);
      } catch (fetchError) {
        logProviderFailure("Razorpay payment status recheck failed", fetchError);
        throw new ApiError(502, "Razorpay could not confirm this payment capture; please try again");
      }
      if (payment.status !== "captured") {
        logProviderFailure("Razorpay payment capture failed", error);
      }
    }
  }

  if (payment.status !== "captured"
      || payment.order_id !== expected.orderId
      || payment.amount !== expected.amount
      || payment.currency !== expected.currency) {
    throw new ApiError(409, "Payment has not been captured for the expected order and amount");
  }
  return payment;
}

export async function verifyWebhook(rawBody, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new ApiError(503, "Razorpay webhook verification is not configured");
  }
  const body = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : "";
  if (!verifyHmac(body, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
    throw new ApiError(400, "Webhook signature is invalid");
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    throw new ApiError(400, "Webhook payload is not valid JSON");
  }
  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id || !payment?.id || payment.status !== "captured") {
      throw new ApiError(400, "Captured payment webhook is missing payment details");
    }
    const transaction = await Transaction.findOne({ providerOrderId: payment.order_id });
    if (!transaction) throw new ApiError(404, "Purchase for this payment was not found");
    if (payment.amount !== transaction.grossAmountPaise
        || payment.currency !== transaction.currency
        || (transaction.providerPaymentId && transaction.providerPaymentId !== payment.id)) {
      throw new ApiError(409, "Captured payment does not match the expected purchase");
    }
    transaction.providerPaymentId ??= payment.id;
    transaction.status = "paid";
    transaction.paidAt ??= new Date();
    await transaction.save();
    await fulfill(transaction);
  } else if (event.event === "payment.failed") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id) {
      await Transaction.updateOne(
        { providerOrderId: payment.order_id, status: "pending" },
        { $set: { status: "failed" } }
      );
    }
  }
  return { received: true };
}

function logProviderFailure(message, error) {
  console.error(message, {
    statusCode: error.statusCode,
    code: error.error?.code ?? error.code
  });
}

async function fulfill(transaction) {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { learnerId: transaction.payerId, courseId: transaction.courseId },
      {
        $setOnInsert: {
          learnerId: transaction.payerId,
          courseId: transaction.courseId,
          transactionId: transaction._id
        }
      },
      { upsert: true, new: true }
    );
    return { transaction, enrollment };
  } catch (error) {
    if (error.code !== 11000) throw error;
    const enrollment = await Enrollment.findOne({
      learnerId: transaction.payerId,
      courseId: transaction.courseId
    });
    if (!enrollment) throw error;
    return { transaction, enrollment };
  }
}
