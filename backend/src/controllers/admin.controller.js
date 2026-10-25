import SkillRequest from "../models/skillRequest.model.js";
import Course from "../models/course.model.js";
import * as skillService from "../services/skill.service.js";
import * as courseService from "../services/course.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const skillRequests = asyncHandler(async (req, res) => {
  const requests = await SkillRequest.aggregate([
    { $match: { status: "pending" } },
    { $lookup: { from: "skillvotes", localField: "_id", foreignField: "skillRequestId", as: "votes" } },
    { $addFields: { voteCount: { $size: "$votes" } } },
    { $project: { votes: 0 } },
    { $sort: { voteCount: -1, createdAt: 1 } },
    { $limit: 100 }
  ]);
  res.json({ success: true, data: { requests } });
});

export const reviewSkillRequest = asyncHandler(async (req, res) => {
  const request = await skillService.reviewRequest(
    req.user._id, req.validated.params.requestId, req.validated.body
  );
  res.json({ success: true, data: { request } });
});

export const pendingCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ status: "submitted" })
    .populate("educatorId", "name email").populate("skillId", "name slug").sort({ updatedAt: 1 });
  res.json({ success: true, data: { courses } });
});

export const reviewCourse = asyncHandler(async (req, res) => {
  const course = await courseService.reviewCourse(
    req.user._id, req.validated.params.courseId, req.validated.body
  );
  res.json({ success: true, data: { course } });
});
