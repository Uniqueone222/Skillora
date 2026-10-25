import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  createdAt: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["question", "discussion", "resource", "announcement"], default: "question" },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  body: { type: String, required: true, trim: true, maxlength: 10000 },
  answers: { type: [answerSchema], default: [] },
  acceptedAnswerId: mongoose.Schema.Types.ObjectId,
  resolvedAt: Date
}, { timestamps: true });

discussionSchema.index({ communityId: 1, createdAt: -1 });

export default mongoose.model("Discussion", discussionSchema);
