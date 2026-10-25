import * as courseService from "../services/course.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const courses = await courseService.listPublishedCourses(req.validated.query);
  res.json({ success: true, data: { courses } });
});

export const get = asyncHandler(async (req, res) => {
  const course = await courseService.getPublicCourse(req.validated.params.courseId);
  res.json({ success: true, data: { course } });
});

export const create = asyncHandler(async (req, res) => {
  const result = await courseService.createDraft(req.user._id, req.validated.body);
  res.status(201).json({ success: true, data: result });
});

export const update = asyncHandler(async (req, res) => {
  const course = await courseService.updateDraft(
    req.user._id,
    req.validated.params.courseId,
    req.validated.body
  );
  res.json({ success: true, data: { course } });
});

export const addModule = asyncHandler(async (req, res) => {
  const course = await courseService.addModule(
    req.user._id,
    req.validated.params.courseId,
    req.validated.body
  );
  res.status(201).json({ success: true, data: { course } });
});

export const updateModule = asyncHandler(async (req, res) => {
  const { courseId, moduleId } = req.validated.params;
  const course = await courseService.updateModule(req.user._id, courseId, moduleId, req.validated.body);
  res.json({ success: true, data: { course } });
});

export const addLesson = asyncHandler(async (req, res) => {
  const { courseId, moduleId } = req.validated.params;
  const course = await courseService.addLesson(req.user._id, courseId, moduleId, req.validated.body);
  res.status(201).json({ success: true, data: { course } });
});

export const updateLesson = asyncHandler(async (req, res) => {
  const { courseId, moduleId, lessonId } = req.validated.params;
  const course = await courseService.updateLesson(
    req.user._id, courseId, moduleId, lessonId, req.validated.body
  );
  res.json({ success: true, data: { course } });
});

export const submit = asyncHandler(async (req, res) => {
  const course = await courseService.submitCourse(req.user._id, req.validated.params.courseId);
  res.json({ success: true, data: { course } });
});

export const myCourses = asyncHandler(async (req, res) => {
  const courses = await courseService.listEducatorCourses(req.user._id);
  res.json({ success: true, data: { courses } });
});

export const learningContent = asyncHandler(async (req, res) => {
  const result = await courseService.getLearningContent(req.user._id, req.validated.params.courseId);
  res.json({ success: true, data: result });
});
