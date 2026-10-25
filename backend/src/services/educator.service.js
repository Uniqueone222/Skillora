import EducatorProfile from "../models/educatorProfile.model.js";
import Community from "../models/community.model.js";
import User from "../models/user.model.js";
import Skill from "../models/skill.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function activate(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.capabilities.includes("educator")) {
    user.capabilities.push("educator");
    await user.save();
  }

  const profile = await EducatorProfile.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { new: true, upsert: true, runValidators: true }
  );
  await Community.updateOne(
    { scope: "educator", educatorId: userId },
    { $setOnInsert: { scope: "educator", educatorId: userId, accessMode: "public" } },
    { upsert: true }
  );

  return { user, profile };
}

export async function updateProfile(userId, changes) {
  if (changes.skills && changes.skills.length > 0) {
    const count = await Skill.countDocuments({ _id: { $in: changes.skills }, status: "approved" });
    if (count !== new Set(changes.skills.map(String)).size) {
      throw new ApiError(400, "All selected skills must be approved catalogue skills");
    }
  }
  const profile = await EducatorProfile.findOneAndUpdate(
    { userId },
    { $set: changes },
    { new: true, runValidators: true }
  );
  if (!profile) {
    throw new ApiError(404, "Educator profile not found");
  }
  return profile;
}

export async function getPublicProfile(userId) {
  const profile = await EducatorProfile.findOne({ userId }).populate("skills", "name slug");
  if (!profile) {
    throw new ApiError(404, "Educator profile not found");
  }
  const user = await User.findById(userId).select("name");
  return { ...profile.toObject(), user };
}
