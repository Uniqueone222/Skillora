import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Course from "../src/models/course.model.js";
import CourseReview from "../src/models/courseReview.model.js";
import Enrollment from "../src/models/enrollment.model.js";
import * as courseService from "../src/services/course.service.js";
import { ApiError } from "../src/utils/ApiError.js";

function replaceMethod(context, target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  context.after(() => {
    target[key] = original;
  });
}

function publishedCourse(educatorId) {
  const course = { _id: new mongoose.Types.ObjectId(), educatorId };
  return {
    course,
    findOne: () => ({ select: async () => course })
  };
}

test("course review schema enforces one review per learner and course", () => {
  const index = CourseReview.schema.indexes()
    .find(([fields]) => fields.courseId === 1 && fields.learnerId === 1);

  assert.equal(index[1].unique, true);
});

test("an enrolled learner can create a course review", async (context) => {
  const learnerId = new mongoose.Types.ObjectId();
  const { course, findOne } = publishedCourse(new mongoose.Types.ObjectId());
  const input = { rating: 4, body: "Useful examples and a clear explanation." };
  let created;
  replaceMethod(context, Course, "findOne", findOne);
  replaceMethod(context, Enrollment, "exists", async (filter) => {
    assert.deepEqual(filter, { learnerId, courseId: course._id });
    return true;
  });
  replaceMethod(context, CourseReview, "create", async (review) => {
    created = review;
    return review;
  });

  await courseService.createCourseReview(learnerId, course._id, input);

  assert.deepEqual(created, { courseId: course._id, learnerId, ...input });
});

test("duplicate course reviews return a conflict", async (context) => {
  const learnerId = new mongoose.Types.ObjectId();
  const { course, findOne } = publishedCourse(new mongoose.Types.ObjectId());
  replaceMethod(context, Course, "findOne", findOne);
  replaceMethod(context, Enrollment, "exists", async () => true);
  replaceMethod(context, CourseReview, "create", async () => {
    throw Object.assign(new Error("Duplicate review"), { code: 11000 });
  });

  await assert.rejects(
    courseService.createCourseReview(learnerId, course._id, { rating: 4, body: "A sufficiently detailed review." }),
    (error) => error instanceof ApiError && error.statusCode === 409
  );
});

test("course owners and non-enrolled learners cannot review a course", async (context) => {
  const learnerId = new mongoose.Types.ObjectId();
  const { course, findOne } = publishedCourse(new mongoose.Types.ObjectId());
  replaceMethod(context, Course, "findOne", findOne);
  replaceMethod(context, Enrollment, "exists", async () => false);

  await assert.rejects(
    courseService.createCourseReview(learnerId, course._id, { rating: 5, body: "A sufficiently long review." }),
    (error) => error instanceof ApiError && error.statusCode === 403
  );

  course.educatorId = learnerId;
  await assert.rejects(
    courseService.createCourseReview(learnerId, course._id, { rating: 5, body: "A sufficiently long review." }),
    (error) => error instanceof ApiError && error.statusCode === 403
  );
});

test("course discovery sorts aggregate ratings and enrollment counts before limiting", async (context) => {
  let pipeline;
  replaceMethod(context, Course, "aggregate", async (value) => {
    pipeline = value;
    return [];
  });
  replaceMethod(context, Course, "populate", async (courses) => courses);

  await courseService.listPublishedCourses({ sort: "rating", limit: 7 });
  assert.deepEqual(pipeline.find((stage) => stage.$sort)?.$sort, {
    ratingAverage: -1,
    reviewCount: -1,
    publishedAt: -1
  });
  assert.ok(pipeline.findIndex((stage) => stage.$sort) < pipeline.findIndex((stage) => stage.$limit));
  assert.equal(pipeline.find((stage) => stage.$limit).$limit, 7);

  await courseService.listPublishedCourses({ sort: "enrollments", limit: 7 });
  assert.deepEqual(pipeline.find((stage) => stage.$sort)?.$sort, {
    enrollmentCount: -1,
    publishedAt: -1
  });
  assert.ok(pipeline.some((stage) => stage.$lookup?.from === Enrollment.collection.name));
});
