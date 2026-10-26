import Skill from "../models/skill.model.js";
import SkillRequest from "../models/skillRequest.model.js";
import SkillVote from "../models/skillVote.model.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizeSkillName, slugify } from "../utils/normalizeSkill.js";

export async function listSkills({ search, category, limit = 30 }) {
  const filter = { status: "approved" };
  if (category) filter.category = category;
  if (search) {
    const expression = { $regex: escapeRegex(search.trim()), $options: "i" };
    filter.$or = [{ name: expression }, { description: expression }];
  }
  return Skill.find(filter).sort({ name: 1 }).limit(Math.min(Number(limit) || 30, 100));
}

export async function getSkill(slug) {
  const skill = await Skill.findOne({ slug, status: "approved" });
  if (!skill) throw new ApiError(404, "Skill not found");
  return skill;
}

export async function listRequests(userId) {
  return SkillRequest.aggregate([
    { $match: { status: "pending" } },
    { $lookup: { from: "skillvotes", localField: "_id", foreignField: "skillRequestId", as: "votes" } },
    {
      $addFields: {
        voteCount: { $size: "$votes" },
        hasVoted: userId ? { $in: [userId, "$votes.userId"] } : false
      }
    },
    { $project: { votes: 0 } },
    { $sort: { voteCount: -1, createdAt: 1 } },
    { $limit: 100 }
  ]);
}

export async function createRequest(userId, input) {
  const normalizedName = normalizeSkillName(input.name);
  if (await Skill.exists({ normalizedName, status: "approved" })) {
    throw new ApiError(409, "That skill is already in the catalogue");
  }
  if (await SkillRequest.exists({ normalizedName, status: "pending" })) {
    throw new ApiError(409, "A matching skill suggestion is already awaiting review");
  }
  const request = await SkillRequest.create({ ...input, normalizedName, suggestedBy: userId });
  await SkillVote.create({ skillRequestId: request._id, userId });
  return request;
}

export async function vote(userId, requestId) {
  const request = await SkillRequest.findOne({ _id: requestId, status: "pending" });
  if (!request) throw new ApiError(404, "Pending skill suggestion not found");
  await SkillVote.create({ skillRequestId: requestId, userId });
  return { requestId, votes: await SkillVote.countDocuments({ skillRequestId: requestId }) };
}

export async function removeVote(userId, requestId) {
  await SkillVote.deleteOne({ skillRequestId: requestId, userId });
  return { requestId, votes: await SkillVote.countDocuments({ skillRequestId: requestId }) };
}

export async function reviewRequest(adminId, requestId, { status, category, description }) {
  const request = await SkillRequest.findOne({ _id: requestId, status: "pending" });
  if (!request) throw new ApiError(404, "Pending skill suggestion not found");

  if (status === "approved") {
    const normalizedName = request.normalizedName;
    let skill = await Skill.findOne({ normalizedName });
    if (!skill) {
      skill = await Skill.create({
        name: request.name,
        normalizedName,
        slug: `${slugify(request.name)}-${request._id.toString().slice(-6)}`,
        category,
        description: description ?? request.description,
        status: "approved"
      });
    }
    request.skillId = skill._id;
  }

  request.status = status;
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  await request.save();
  return request;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
