import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000, default: "" },
  videoAssetId: { type: String, trim: true, maxlength: 300, default: "" },
  durationSeconds: { type: Number, min: 0, default: 0 },
  isPreview: { type: Boolean, default: false },
  resources: [{ title: { type: String, trim: true }, url: { type: String, trim: true } }]
}, { timestamps: true });

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  lessons: { type: [lessonSchema], default: [] }
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  educatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true, index: true },
  thumbnailUrl: { type: String, trim: true, default: "" },
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  pricePaise: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ["INR"], default: "INR" },
  modules: { type: [moduleSchema], default: [] },
  status: { type: String, enum: ["draft", "submitted", "published", "rejected", "suspended"], default: "draft", index: true },
  rejectionReason: { type: String, trim: true, maxlength: 1000, default: "" },
  publishedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date
}, { timestamps: true });

courseSchema.index({ skillId: 1, status: 1, createdAt: -1 });
courseSchema.index({ educatorId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Course", courseSchema);
