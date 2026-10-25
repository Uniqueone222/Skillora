import * as educatorService from "../services/educator.service.js";
import { publicUser } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const activate = asyncHandler(async (req, res) => {
  const result = await educatorService.activate(req.user._id);
  res.status(201).json({
    success: true,
    data: { user: publicUser(result.user), profile: result.profile }
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await educatorService.updateProfile(req.user._id, req.validated.body);
  res.json({ success: true, data: { profile } });
});

export const getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await educatorService.getPublicProfile(req.validated.params.educatorId);
  res.json({ success: true, data: { profile } });
});
