import Community from "../models/community.model.js";
import Discussion from "../models/discussion.model.js";
import EducatorProfile from "../models/educatorProfile.model.js";
import Enrollment from "../models/enrollment.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function readCommunity(userId, communityId) {
  const community = await Community.findById(communityId);
  if (!community || community.accessMode === "disabled") {
    throw new ApiError(404, "Community is unavailable");
  }
  await assertAccess(userId, community);
  return community;
}

export async function findCommunity(userId, { scope, courseId, educatorId }) {
  const filter = scope === "course" ? { scope, courseId } : { scope, educatorId };
  const community = await Community.findOne(filter);
  if (!community) throw new ApiError(404, "Community not found");
  await assertAccess(userId, community);
  return community;
}

export async function updateSettings(userId, communityId, accessMode) {
  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, "Community not found");
  if (community.educatorId.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the educator who owns this community can change its settings");
  }
  community.accessMode = accessMode;
  await community.save();
  return community;
}

export async function listDiscussions(userId, communityId) {
  await readCommunity(userId, communityId);
  return Discussion.find({ communityId })
    .populate("authorId", "name")
    .populate("answers.authorId", "name")
    .sort({ createdAt: -1 })
    .limit(50);
}

export async function createDiscussion(userId, communityId, input) {
  const community = await readCommunity(userId, communityId);
  if (community.accessMode === "educator_responses_only" && input.type !== "question") {
    throw new ApiError(403, "This community accepts questions for educator responses only");
  }
  return Discussion.create({ ...input, communityId, authorId: userId });
}

export async function addAnswer(userId, discussionId, body) {
  const discussion = await Discussion.findById(discussionId);
  if (!discussion) throw new ApiError(404, "Discussion not found");
  const community = await readCommunity(userId, discussion.communityId);
  const isEducator = community.educatorId.toString() === userId.toString();
  if (community.accessMode === "educator_responses_only" && !isEducator) {
    throw new ApiError(403, "Only the educator can respond in this community");
  }
  discussion.answers.push({ authorId: userId, body });
  await discussion.save();
  return discussion;
}

export async function resolveDiscussion(userId, discussionId, answerId) {
  const discussion = await Discussion.findById(discussionId);
  if (!discussion) throw new ApiError(404, "Discussion not found");
  const community = await readCommunity(userId, discussion.communityId);
  if (community.educatorId.toString() !== userId.toString()
      && discussion.authorId.toString() !== userId.toString()) {
    throw new ApiError(403, "Only the discussion author or educator can resolve it");
  }
  if (!discussion.answers.id(answerId)) throw new ApiError(404, "Answer not found");
  discussion.acceptedAnswerId = answerId;
  discussion.resolvedAt = new Date();
  await discussion.save();
  return discussion;
}

async function assertAccess(userId, community) {
  if (community.accessMode === "public") return;

  if (community.accessMode === "enrolled") {
    const enrolled = community.scope === "course"
      ? await Enrollment.exists({ learnerId: userId, courseId: community.courseId })
      : await hasEducatorEnrollment(userId, community.educatorId);
    if (!enrolled && community.educatorId.toString() !== userId.toString()) {
      throw new ApiError(403, "An active enrollment is required to access this community");
    }
  }

  if (community.accessMode === "educator_responses_only") {
    const profile = await EducatorProfile.exists({ userId: community.educatorId });
    if (!profile) throw new ApiError(404, "Community is unavailable");
  }
}

async function hasEducatorEnrollment(userId, educatorId) {
  const enrollments = await Enrollment.find({ learnerId: userId }).select("courseId").lean();
  if (enrollments.length === 0) return false;
  const courseIds = enrollments.map(({ courseId }) => courseId);
  const Course = (await import("../models/course.model.js")).default;
  return Boolean(await Course.exists({ _id: { $in: courseIds }, educatorId }));
}
