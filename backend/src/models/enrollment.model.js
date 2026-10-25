import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
  completedLessonIds: [{ type: mongoose.Schema.Types.ObjectId }],
  lastLessonId: mongoose.Schema.Types.ObjectId,
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });

enrollmentSchema.index({ learnerId: 1, courseId: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
