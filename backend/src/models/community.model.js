import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  scope: { type: String, enum: ["course", "educator"], required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  educatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accessMode: { type: String, enum: ["public", "enrolled", "educator_responses_only", "disabled"], default: "public" }
}, { timestamps: true });

communitySchema.index({ courseId: 1 }, {
  unique: true,
  partialFilterExpression: { scope: "course", courseId: { $type: "objectId" } }
});
communitySchema.index({ educatorId: 1 }, {
  unique: true,
  partialFilterExpression: { scope: "educator" }
});

export default mongoose.model("Community", communitySchema);
