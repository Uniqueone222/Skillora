import mongoose from "mongoose";

const skillVoteSchema = new mongoose.Schema({
  skillRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "SkillRequest", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

skillVoteSchema.index({ skillRequestId: 1, userId: 1 }, { unique: true });

export default mongoose.model("SkillVote", skillVoteSchema);
