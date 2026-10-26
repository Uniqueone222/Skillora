import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import Course from "../models/course.model.js";
import Skill from "../models/skill.model.js";
import Community from "../models/community.model.js";
import Enrollment from "../models/enrollment.model.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { slugify } from "../utils/normalizeSkill.js";
import {
  createSignedPlaybackUrl,
  createVideoUploadAuthorization,
  deleteVideo,
  getUploadedVideo,
  MAX_VIDEO_BYTES,
  SUPPORTED_VIDEO_FORMATS
} from "./cloudinary.service.js";

export async function createDraft(educatorId, input) {
  const skill = await Skill.findOne({ _id: input.skillId, status: "approved" });
  if (!skill) throw new ApiError(400, "Selected skill is unavailable");

  const course = await Course.create({
    ...input,
    educatorId,
    slug: `${slugify(input.title)}-${randomUUID().slice(0, 8)}`,
    status: "draft"
  });
  const community = await Community.create({
    scope: "course",
    courseId: course._id,
    educatorId,
    accessMode: "enrolled"
  });
  return { course, community };
}

export async function updateDraft(educatorId, courseId, changes) {
  if (changes.skillId && !(await Skill.exists({ _id: changes.skillId, status: "approved" }))) {
    throw new ApiError(400, "Selected skill is unavailable");
  }
  const course = await Course.findOne({ _id: courseId, educatorId });
  if (!course) throw new ApiError(404, "Course not found");
  if (!["draft", "rejected"].includes(course.status)) {
    throw new ApiError(409, "Only draft or rejected courses can be edited");
  }
  Object.assign(course, changes, { status: "draft", rejectionReason: "" });
  await course.save();
  return course;
}

export async function addModule(educatorId, courseId, module) {
  const course = await ownedEditableCourse(educatorId, courseId);
  course.modules.push(module);
  await course.save();
  return course;
}

export async function addLesson(educatorId, courseId, moduleId, lesson) {
  const course = await ownedEditableCourse(educatorId, courseId);
  const module = course.modules.id(moduleId);
  if (!module) throw new ApiError(404, "Course module not found");
  module.lessons.push(lesson);
  await course.save();
  return course;
}

export async function updateModule(educatorId, courseId, moduleId, changes) {
  const course = await ownedEditableCourse(educatorId, courseId);
  const module = course.modules.id(moduleId);
  if (!module) throw new ApiError(404, "Course module not found");
  Object.assign(module, changes);
  await course.save();
  return course;
}

export async function updateLesson(educatorId, courseId, moduleId, lessonId, changes) {
  const course = await ownedEditableCourse(educatorId, courseId);
  const module = course.modules.id(moduleId);
  const lesson = module?.lessons.id(lessonId);
  if (!lesson) throw new ApiError(404, "Course lesson not found");
  Object.assign(lesson, changes);
  await course.save();
  return course;
}

export async function createLessonVideoUpload(educatorId, { courseId, moduleId, lessonId }) {
  const course = await ownedEditableCourse(educatorId, courseId);
  requireLesson(course, moduleId, lessonId);

  const publicId = `skillora/${courseId}/${moduleId}/${lessonId}/${randomUUID()}`;
  const authorization = createVideoUploadAuthorization(publicId);
  const uploadTicket = jwt.sign({
    sub: String(educatorId),
    scope: "lesson-video-upload",
    courseId: String(courseId),
    moduleId: String(moduleId),
    lessonId: String(lessonId),
    publicId
  }, env.JWT_ACCESS_SECRET, {
    audience: "skillora-cloudinary-upload",
    expiresIn: "30m"
  });

  return { ...authorization, uploadTicket };
}

export async function completeLessonVideoUpload(
  educatorId,
  { courseId, moduleId, lessonId },
  { uploadTicket, assetId }
) {
  const ticket = verifyVideoUploadTicket(uploadTicket, educatorId, { courseId, moduleId, lessonId });
  const course = await ownedEditableCourse(educatorId, courseId);
  const lesson = requireLesson(course, moduleId, lessonId);
  const asset = await getUploadedVideo(ticket.publicId);

  if (!asset) throw new ApiError(400, "Cloudinary does not have the uploaded video");
  const format = String(asset.format || "").toLowerCase();
  const bytes = Number(asset.bytes);
  const duration = Number(asset.duration);
  const version = Number(asset.version);
  const assetIsValid = asset.asset_id === assetId
    && asset.public_id === ticket.publicId
    && asset.resource_type === "video"
    && asset.type === "authenticated"
    && SUPPORTED_VIDEO_FORMATS.has(format)
    && Number.isFinite(bytes)
    && bytes > 0
    && bytes <= MAX_VIDEO_BYTES
    && Number.isFinite(duration)
    && duration > 0
    && Number.isInteger(version)
    && version > 0;

  if (!assetIsValid) {
    await deleteVideo(ticket.publicId);
    throw new ApiError(400, "The uploaded file must be an MP4 or WebM video no larger than 100 MB");
  }

  const previousPublicId = lesson.videoPublicId;
  lesson.videoAssetId = asset.asset_id;
  lesson.videoPublicId = asset.public_id;
  lesson.videoFormat = format;
  lesson.videoVersion = version;
  lesson.durationSeconds = Math.round(duration);
  try {
    await course.save();
  } catch (cause) {
    try {
      await deleteVideo(asset.public_id);
    } catch (cleanupError) {
      console.error("Could not clean up a video after its lesson save failed", cleanupError);
      const error = new ApiError(502, "The lesson could not be saved and the uploaded video could not be removed");
      error.cause = cause;
      throw error;
    }
    throw cause;
  }

  let cleanupWarning = "";
  if (previousPublicId && previousPublicId !== asset.public_id) {
    try {
      await deleteVideo(previousPublicId);
    } catch (error) {
      console.error(`Could not remove replaced lesson video ${previousPublicId}`, error);
      cleanupWarning = "The new video is attached, but the previous video could not be removed.";
    }
  }

  return { lesson, cleanupWarning };
}

export async function getLessonPlayback(userId, { courseId, moduleId, lessonId }) {
  const course = await Course.findOne({ _id: courseId, status: "published" });
  if (!course) throw new ApiError(404, "Course not found");
  const lesson = requireLesson(course, moduleId, lessonId);
  const isEducator = String(course.educatorId) === String(userId);

  if (!lesson.isPreview && !isEducator) {
    const enrollment = await Enrollment.findOne({ learnerId: userId, courseId }).select("_id");
    if (!enrollment) throw new ApiError(403, "An active enrollment is required to watch this lesson");
  }
  if (!lesson.videoAssetId || !lesson.videoPublicId || !lesson.videoFormat || !lesson.videoVersion) {
    throw new ApiError(404, "No video has been uploaded for this lesson");
  }

  return {
    url: createSignedPlaybackUrl(lesson.videoPublicId, lesson.videoFormat, lesson.videoVersion),
    durationSeconds: lesson.durationSeconds
  };
}

export async function submitCourse(educatorId, courseId) {
  const course = await Course.findOne({ _id: courseId, educatorId });
  if (!course) throw new ApiError(404, "Course not found");
  if (!["draft", "rejected"].includes(course.status)) {
    throw new ApiError(409, "Only draft or rejected courses can be submitted");
  }
  if (!course.modules.length || !course.modules.some((module) => module.lessons.length)) {
    throw new ApiError(400, "Add at least one module and lesson before submitting");
  }
  course.status = "submitted";
  course.rejectionReason = "";
  await course.save();
  return course;
}

export async function reviewCourse(adminId, courseId, { status, rejectionReason = "" }) {
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");
  if (status === "suspended") {
    if (course.status !== "published") throw new ApiError(409, "Only published courses can be suspended");
  } else if (course.status !== "submitted") {
    throw new ApiError(409, "Only submitted courses can be approved or rejected");
  }
  if (status === "rejected" && !rejectionReason) {
    throw new ApiError(400, "A rejection reason is required");
  }
  course.status = status;
  course.rejectionReason = status === "rejected" ? rejectionReason : "";
  course.reviewedBy = adminId;
  course.reviewedAt = new Date();
  if (status === "published") course.publishedAt = new Date();
  await course.save();
  return course;
}

export async function listPublishedCourses({ skillId, educatorId, category, search, difficulty, price, limit = 30 }) {
  const filter = { status: "published" };
  if (skillId) filter.skillId = skillId;
  if (educatorId) filter.educatorId = educatorId;
  if (category && !skillId) {
    const skills = await Skill.find({ category, status: "approved" }).select("_id");
    filter.skillId = { $in: skills.map((skill) => skill._id) };
  }
  if (search) {
    const expression = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ title: expression }, { description: expression }];
  }
  if (difficulty) filter.difficulty = difficulty;
  if (price === "free") filter.pricePaise = 0;
  if (price === "paid") filter.pricePaise = { $gt: 0 };
  return Course.find(filter).select("-modules").populate("skillId", "name slug")
    .populate("educatorId", "name").sort({ publishedAt: -1 }).limit(Math.min(Number(limit) || 30, 100));
}

export async function getPublicCourse(courseId) {
  const course = await Course.findOne({ _id: courseId, status: "published" })
    .select("-modules")
    .populate("skillId", "name slug")
    .populate("educatorId", "name");
  if (!course) throw new ApiError(404, "Course not found");
  return course;
}

export async function getLearningContent(userId, courseId) {
  const course = await Course.findOne({ _id: courseId, status: "published" });
  if (!course) throw new ApiError(404, "Course not found");
  const enrollment = await Enrollment.findOne({ learnerId: userId, courseId }).select("completedLessonIds");
  const isEducator = String(course.educatorId) === String(userId);
  return {
    course: {
      id: course._id,
      title: course.title,
      modules: course.modules.map((module) => ({
        id: module._id,
        title: module.title,
        description: module.description,
        lessons: module.lessons
          .filter((lesson) => enrollment || isEducator || lesson.isPreview)
          .map((lesson) => ({
            id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            hasVideo: Boolean(lesson.videoAssetId && lesson.videoPublicId && lesson.videoFormat && lesson.videoVersion),
            durationSeconds: lesson.durationSeconds,
            isPreview: lesson.isPreview,
            resources: lesson.resources
          }))
      }))
    },
    enrolled: Boolean(enrollment),
    isEducator,
    completedLessonIds: enrollment?.completedLessonIds.map(String) ?? []
  };
}

export async function listEducatorCourses(educatorId) {
  return Course.find({ educatorId }).populate("skillId", "name slug").sort({ updatedAt: -1 });
}

async function ownedEditableCourse(educatorId, courseId) {
  const course = await Course.findOne({ _id: courseId, educatorId });
  if (!course) throw new ApiError(404, "Course not found");
  if (!["draft", "rejected"].includes(course.status)) {
    throw new ApiError(409, "Only draft or rejected courses can be edited");
  }
  return course;
}

function requireLesson(course, moduleId, lessonId) {
  const module = course.modules.id(moduleId);
  if (!module) throw new ApiError(404, "Course module not found");
  const lesson = module.lessons.id(lessonId);
  if (!lesson) throw new ApiError(404, "Course lesson not found");
  return lesson;
}

function verifyVideoUploadTicket(uploadTicket, educatorId, { courseId, moduleId, lessonId }) {
  let ticket;
  try {
    ticket = jwt.verify(uploadTicket, env.JWT_ACCESS_SECRET, {
      audience: "skillora-cloudinary-upload"
    });
  } catch {
    throw new ApiError(401, "The video upload authorization is invalid or expired");
  }

  if (
    ticket.scope !== "lesson-video-upload"
    || ticket.sub !== String(educatorId)
    || ticket.courseId !== String(courseId)
    || ticket.moduleId !== String(moduleId)
    || ticket.lessonId !== String(lessonId)
    || typeof ticket.publicId !== "string"
  ) {
    throw new ApiError(403, "The video upload authorization does not match this lesson");
  }
  return ticket;
}
