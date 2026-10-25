import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Transaction from "../models/transaction.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function listMine(userId) {
  return Enrollment.find({ learnerId: userId })
    .populate({ path: "courseId", select: "title slug thumbnailUrl educatorId skillId modules", populate: [
      { path: "educatorId", select: "name" },
      { path: "skillId", select: "name slug" }
    ] })
    .sort({ enrolledAt: -1 });
}

export async function updateProgress(userId, courseId, { lessonId, completed }) {
  const enrollment = await Enrollment.findOne({ learnerId: userId, courseId });
  if (!enrollment) throw new ApiError(403, "An active enrollment is required");

  const course = await Course.findOne({ _id: courseId, status: "published" });
  if (!course) throw new ApiError(404, "Course not found");
  const lessonExists = course.modules.some((module) => module.lessons.id(lessonId));
  if (!lessonExists) throw new ApiError(404, "Lesson not found");

  if (completed) {
    await Enrollment.updateOne(
      { _id: enrollment._id },
      { $addToSet: { completedLessonIds: lessonId }, $set: { lastLessonId: lessonId } }
    );
  } else {
    await Enrollment.updateOne(
      { _id: enrollment._id },
      { $pull: { completedLessonIds: lessonId }, $set: { lastLessonId: lessonId } }
    );
  }
  return Enrollment.findById(enrollment._id);
}

export async function createFreeEnrollment(userId, courseId) {
  const course = await Course.findOne({ _id: courseId, status: "published" });
  if (!course) throw new ApiError(404, "Published course not found");
  if (course.pricePaise !== 0) {
    throw new ApiError(403, "Payment is required before accessing this course");
  }

  const existing = await Enrollment.findOne({ learnerId: userId, courseId });
  if (existing) return existing;
  const transaction = await Transaction.create({
    payerId: userId,
    educatorId: course.educatorId,
    courseId: course._id,
    grossAmountPaise: 0,
    educatorAmountPaise: 0,
    provider: "free",
    status: "paid",
    paidAt: new Date()
  });
  return Enrollment.findOneAndUpdate(
    { learnerId: userId, courseId },
    { $setOnInsert: { learnerId: userId, courseId, transactionId: transaction._id } },
    { upsert: true, new: true }
  );
}
