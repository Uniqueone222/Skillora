import { ApiError } from "../utils/ApiError.js";

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    return next();
  };
}

export function requireCapability(capability) {
  return (req, res, next) => {
    if (!req.user?.capabilities.includes(capability)) {
      return next(new ApiError(403, "Activate educator capabilities to perform this action"));
    }
    return next();
  };
}
