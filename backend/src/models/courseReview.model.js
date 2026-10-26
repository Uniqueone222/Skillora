import mongoose from "mongoose";

const courseReviewSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  body: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 }
}, { timestamps: true });

courseReviewSchema.index({ courseId: 1, learnerId: 1 }, { unique: true });
courseReviewSchema.index({ courseId: 1, createdAt: -1 });

export default mongoose.model("CourseReview", courseReviewSchema);
