import mongoose from "mongoose";

const skillRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  normalizedName: { type: String, required: true },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  intent: { type: String, enum: ["learn", "teach"], default: "learn", index: true },
  suggestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill" }
}, { timestamps: true });

skillRequestSchema.index({ normalizedName: 1, status: 1 });
skillRequestSchema.index(
  { normalizedName: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

export default mongoose.model("SkillRequest", skillRequestSchema);
