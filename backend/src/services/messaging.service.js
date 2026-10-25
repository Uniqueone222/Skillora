import Conversation from "../models/conversation.model.js";
import EducatorProfile from "../models/educatorProfile.model.js";
import Message from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";

export async function startConversation(learnerId, educatorId) {
  if (learnerId.toString() === educatorId) {
    throw new ApiError(400, "You cannot start a conversation with yourself");
  }
  const profile = await EducatorProfile.findOne({ userId: educatorId, messagingEnabled: true });
  if (!profile) throw new ApiError(403, "This educator is not accepting messages");

  const conversation = await Conversation.findOneAndUpdate(
    { learnerId, educatorId },
    { $setOnInsert: { learnerId, educatorId, participants: [learnerId, educatorId] } },
    { new: true, upsert: true }
  );
  return conversation;
}

export async function listConversations(userId) {
  return Conversation.find({ participants: userId })
    .populate("participants", "name")
    .sort({ lastMessageAt: -1, updatedAt: -1 });
}

export async function listMessages(userId, conversationId) {
  await requireParticipant(userId, conversationId);
  return Message.find({ conversationId }).sort({ createdAt: 1 }).limit(100).populate("senderId", "name");
}

export async function sendMessage(userId, conversationId, body) {
  const conversation = await requireParticipant(userId, conversationId);
  if (userId.toString() === conversation.learnerId.toString()) {
    const profile = await EducatorProfile.findOne({ userId: conversation.educatorId, messagingEnabled: true });
    if (!profile) throw new ApiError(403, "This educator is not accepting messages");
  }
  const message = await Message.create({ conversationId, senderId: userId, body });
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();
  return message;
}

async function requireParticipant(userId, conversationId) {
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conversation) throw new ApiError(404, "Conversation not found");
  return conversation;
}
