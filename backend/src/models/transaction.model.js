import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  educatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  grossAmountPaise: { type: Number, required: true, min: 0 },
  platformFeePaise: { type: Number, required: true, min: 0, default: 0 },
  educatorAmountPaise: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ["INR"], default: "INR" },
  provider: { type: String, enum: ["razorpay", "free"], required: true },
  providerOrderId: { type: String, unique: true, sparse: true },
  providerPaymentId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending", index: true },
  paidAt: Date
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);
