import * as messagingService from "../services/messaging.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const start = asyncHandler(async (req, res) => {
  const conversation = await messagingService.startConversation(
    req.user._id, req.validated.body.educatorId
  );
  res.status(201).json({ success: true, data: { conversation } });
});

export const list = asyncHandler(async (req, res) => {
  const conversations = await messagingService.listConversations(req.user._id);
  res.json({ success: true, data: { conversations } });
});

export const messages = asyncHandler(async (req, res) => {
  const messages = await messagingService.listMessages(
    req.user._id, req.validated.params.conversationId
  );
  res.json({ success: true, data: { messages } });
});

export const send = asyncHandler(async (req, res) => {
  const message = await messagingService.sendMessage(
    req.user._id, req.validated.params.conversationId, req.validated.body.body
  );
  res.status(201).json({ success: true, data: { message } });
});
