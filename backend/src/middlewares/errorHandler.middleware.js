import mongoose from "mongoose";
import { ZodError } from "zod";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Request validation failed",
      details: error.issues.map(({ path, message }) => ({ field: path.join("."), message }))
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ success: false, message: "Invalid resource identifier" });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ success: false, message: "A record with those details already exists" });
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "An unexpected server error occurred" : error.message,
    ...(error.details ? { details: error.details } : {})
  });
}
