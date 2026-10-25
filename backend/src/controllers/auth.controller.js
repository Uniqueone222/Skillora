import * as authService from "../services/auth.service.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000
};

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.validated.body);
  const token = authService.signToken(user);
  res.cookie("skillora_token", token, cookieOptions);
  res.status(201).json({ success: true, data: { user: authService.publicUser(user) } });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.validated.body);
  res.cookie("skillora_token", token, cookieOptions);
  res.json({ success: true, data: { user: authService.publicUser(user) } });
});

export function logout(req, res) {
  res.clearCookie("skillora_token", { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, data: { loggedOut: true } });
}

export function me(req, res) {
  res.json({ success: true, data: { user: authService.publicUser(req.user) } });
}
