import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  normalizedName: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  category: { type: String, trim: true, maxlength: 80, default: "Other" },
  status: { type: String, enum: ["approved", "archived"], default: "approved", index: true }
}, { timestamps: true });

export default mongoose.model("Skill", skillSchema);
