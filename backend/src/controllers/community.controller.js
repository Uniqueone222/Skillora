import * as communityService from "../services/community.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const get = asyncHandler(async (req, res) => {
  const community = await communityService.findCommunity(req.user._id, req.validated.query);
  res.json({ success: true, data: { community } });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const community = await communityService.updateSettings(
    req.user._id,
    req.validated.params.communityId,
    req.validated.body.accessMode
  );
  res.json({ success: true, data: { community } });
});

export const discussions = asyncHandler(async (req, res) => {
  const discussions = await communityService.listDiscussions(
    req.user._id, req.validated.params.communityId
  );
  res.json({ success: true, data: { discussions } });
});

export const createDiscussion = asyncHandler(async (req, res) => {
  const discussion = await communityService.createDiscussion(
    req.user._id,
    req.validated.params.communityId,
    req.validated.body
  );
  res.status(201).json({ success: true, data: { discussion } });
});

export const addAnswer = asyncHandler(async (req, res) => {
  const discussion = await communityService.addAnswer(
    req.user._id, req.validated.params.discussionId, req.validated.body.body
  );
  res.status(201).json({ success: true, data: { discussion } });
});

export const resolve = asyncHandler(async (req, res) => {
  const discussion = await communityService.resolveDiscussion(
    req.user._id,
    req.validated.params.discussionId,
    req.validated.body.answerId
  );
  res.json({ success: true, data: { discussion } });
});
