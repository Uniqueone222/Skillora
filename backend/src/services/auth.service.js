import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { adminEmails, env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export async function register({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "An account with that email already exists");
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    role: adminEmails.has(normalizedEmail) ? "admin" : "user"
  });

  return user;
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Email or password is incorrect");
  }

  return { user, token: signToken(user) };
}

export function signToken(user) {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: user._id.toString(),
    expiresIn: env.JWT_EXPIRES_IN
  });
}

export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    capabilities: user.capabilities
  };
}
