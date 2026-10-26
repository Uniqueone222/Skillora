import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function getAuthenticatedUser(req) {
  const token = req.cookies?.skillora_token
    ?? req.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired session");
  }

  const user = await User.findById(payload.sub).select("_id name email role capabilities");
  if (!user) {
    throw new ApiError(401, "Session user no longer exists");
  }

  return user;
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const user = await getAuthenticatedUser(req);
  if (!user) throw new ApiError(401, "Authentication required");
  req.user = user;
  next();
});

export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  req.user = await getAuthenticatedUser(req);
  next();
});
