import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const MAX_VIDEO_BYTES = 100 * 1000 * 1000;
export const SUPPORTED_VIDEO_FORMATS = new Set(["mp4", "webm"]);

const cloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

function requireCloudinary() {
  if (!cloudinaryConfigured) {
    throw new ApiError(503, "Cloudinary video storage is not configured");
  }
}

function providerError(message, cause) {
  const error = new ApiError(502, message);
  error.cause = cause;
  return error;
}

export function createSignedUpload(parameters, apiSecret) {
  return cloudinary.utils.api_sign_request(parameters, apiSecret);
}

export function createVideoUploadAuthorization(publicId) {
  requireCloudinary();
  const parameters = {
    overwrite: "false",
    public_id: publicId,
    timestamp: Math.floor(Date.now() / 1000),
    type: "authenticated"
  };

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/video/upload`,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    signature: createSignedUpload(parameters, env.CLOUDINARY_API_SECRET),
    parameters
  };
}

export async function getUploadedVideo(publicId) {
  requireCloudinary();
  try {
    return await cloudinary.api.resource(publicId, {
      resource_type: "video",
      type: "authenticated"
    });
  } catch (cause) {
    if (Number(cause?.http_code) === 404) return null;
    throw providerError("Cloudinary could not verify the uploaded video", cause);
  }
}

export async function deleteVideo(publicId) {
  requireCloudinary();
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
      type: "authenticated",
      invalidate: true
    });
    if (!["ok", "not found"].includes(result.result)) {
      throw new Error(`Cloudinary returned an unexpected delete result: ${result.result}`);
    }
  } catch (cause) {
    throw providerError("Cloudinary could not remove the video asset", cause);
  }
}

export function createSignedPlaybackUrl(publicId, format, version) {
  requireCloudinary();
  if (!SUPPORTED_VIDEO_FORMATS.has(format)) {
    throw new ApiError(500, "The stored video format is not supported");
  }

  return cloudinary.url(publicId, {
    resource_type: "video",
    type: "authenticated",
    sign_url: true,
    secure: true,
    version,
    format
  });
}
