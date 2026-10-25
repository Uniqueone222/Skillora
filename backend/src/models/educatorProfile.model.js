import mongoose from "mongoose";

const educatorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  headline: { type: String, trim: true, maxlength: 120, default: "" },
  biography: { type: String, trim: true, maxlength: 3000, default: "" },
  expertise: [{ type: String, trim: true, maxlength: 80 }],
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
  messagingEnabled: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("EducatorProfile", educatorProfileSchema);
