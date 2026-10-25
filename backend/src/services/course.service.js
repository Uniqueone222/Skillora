import { randomUUID } from "node:crypto";
import Course from "../models/course.model.js";
import Skill from "../models/skill.model.js";
import Community from "../models/community.model.js";
import Enrollment from "../models/enrollment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { slugify } from "../utils/normalizeSkill.js";

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

export async function listPublishedCourses({ skillId, educatorId, search, limit = 30 }) {
  const filter = { status: "published" };
  if (skillId) filter.skillId = skillId;
  if (educatorId) filter.educatorId = educatorId;
  if (search) filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
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
  return {
    course: {
      id: course._id,
      title: course.title,
      modules: course.modules.map((module) => ({
        id: module._id,
        title: module.title,
        description: module.description,
        lessons: module.lessons
          .filter((lesson) => enrollment || lesson.isPreview)
          .map((lesson) => ({
            id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            videoAssetId: lesson.videoAssetId,
            durationSeconds: lesson.durationSeconds,
            isPreview: lesson.isPreview,
            resources: lesson.resources
          }))
      }))
    },
    enrolled: Boolean(enrollment),
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
