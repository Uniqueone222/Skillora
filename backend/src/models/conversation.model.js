import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    validate: {
      validator: (participants) => participants.length === 2
        && participants[0].toString() !== participants[1].toString(),
      message: "A conversation must have two different participants"
    }
  },
  educatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lastMessageAt: Date
}, { timestamps: true });

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ learnerId: 1, educatorId: 1 }, { unique: true });

export default mongoose.model("Conversation", conversationSchema);
