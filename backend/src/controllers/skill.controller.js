import * as skillService from "../services/skill.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const skills = await skillService.listSkills(req.validated.query);
  res.json({ success: true, data: { skills } });
});

export const get = asyncHandler(async (req, res) => {
  const skill = await skillService.getSkill(req.params.slug);
  res.json({ success: true, data: { skill } });
});

export const createRequest = asyncHandler(async (req, res) => {
  const request = await skillService.createRequest(req.user._id, req.validated.body);
  res.status(201).json({ success: true, data: { request } });
});

export const listRequests = asyncHandler(async (req, res) => {
  const requests = await skillService.listRequests();
  res.json({ success: true, data: { requests } });
});

export const vote = asyncHandler(async (req, res) => {
  const result = await skillService.vote(req.user._id, req.validated.params.requestId);
  res.status(201).json({ success: true, data: result });
});

export const removeVote = asyncHandler(async (req, res) => {
  const result = await skillService.removeVote(req.user._id, req.validated.params.requestId);
  res.json({ success: true, data: result });
});
