import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/skillora-test";
process.env.JWT_ACCESS_SECRET = "test-only-secret-with-at-least-thirty-two-characters";
process.env.CLOUDINARY_CLOUD_NAME = "skillora-test";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";

const [
  { default: Course },
  { default: Enrollment },
  cloudinaryService,
  courseService,
  courseValidators
] = await Promise.all([
  import("../src/models/course.model.js"),
  import("../src/models/enrollment.model.js"),
  import("../src/services/cloudinary.service.js"),
  import("../src/services/course.service.js"),
  import("../src/validators/courses.validator.js")
]);

function replaceMethod(context, target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  context.after(() => {
    target[key] = original;
  });
}

test("educators cannot assign provider media IDs or duration through lesson payloads", () => {
  const valid = {
    params: { courseId: "a".repeat(24), moduleId: "b".repeat(24) },
    body: { title: "Introduction", description: "", isPreview: false }
  };
  assert.equal(courseValidators.lessonSchema.safeParse(valid).success, true);
  assert.equal(courseValidators.lessonSchema.safeParse({
    ...valid,
    body: { ...valid.body, videoAssetId: "attacker-controlled" }
  }).success, false);
  assert.equal(courseValidators.updateLessonSchema.safeParse({
    params: { ...valid.params, lessonId: "c".repeat(24) },
    body: { durationSeconds: 999 }
  }).success, false);
});

test("courses can save lesson drafts without media provider metadata", async () => {
  const course = new Course({
    title: "Video course",
    slug: "video-course",
    description: "A course used to validate lesson defaults.",
    educatorId: "aaaaaaaaaaaaaaaaaaaaaaaa",
    skillId: "bbbbbbbbbbbbbbbbbbbbbbbb",
    pricePaise: 0,
    modules: [{ title: "Module", lessons: [{ title: "Lesson" }] }]
  });

  await course.validate();
  assert.equal(course.modules[0].lessons[0].videoVersion, 0);
});

test("Cloudinary upload signatures use the submitted signed parameters", () => {
  const parameters = {
    overwrite: "false",
    public_id: "skillora/courses/lesson-id",
    timestamp: 1234567890,
    type: "authenticated"
  };
  const canonical = Object.keys(parameters).sort()
    .map((key) => `${key}=${parameters[key]}`)
    .join("&");
  const expected = crypto.createHash("sha1")
    .update(`${canonical}test-secret`)
    .digest("hex");

  assert.equal(cloudinaryService.createSignedUpload(parameters, "test-secret"), expected);
});

test("Cloudinary upload authorization uses authenticated media and a unique signed public ID", () => {
  const authorization = cloudinaryService.createVideoUploadAuthorization("skillora/course/module/lesson/random");

  assert.equal(authorization.parameters.type, "authenticated");
  assert.equal(authorization.parameters.overwrite, "false");
  assert.equal(authorization.parameters.public_id, "skillora/course/module/lesson/random");
  assert.match(authorization.uploadUrl, /\/video\/upload$/);
  assert.equal(authorization.signature, cloudinaryService.createSignedUpload(
    authorization.parameters,
    process.env.CLOUDINARY_API_SECRET
  ));
});

test("paid lesson playback requires a course enrollment", async (context) => {
  const userId = "learner-123";
  const lesson = {
    isPreview: false,
    videoAssetId: "provider-asset-id",
    videoPublicId: "skillora/paid-lesson",
    videoFormat: "mp4",
    videoVersion: 12345,
    durationSeconds: 60
  };
  const course = {
    educatorId: "educator-456",
    modules: { id: () => ({ lessons: { id: () => lesson } }) }
  };
  replaceMethod(context, Course, "findOne", async () => course);
  replaceMethod(context, Enrollment, "findOne", () => ({
    select: async () => null
  }));

  await assert.rejects(
    courseService.getLessonPlayback(userId, {
      courseId: "course-123",
      moduleId: "module-123",
      lessonId: "lesson-123"
    }),
    (error) => error.statusCode === 403
  );
});

test("course educators can preview their own published lesson media", async (context) => {
  const lesson = {
    isPreview: false,
    videoAssetId: "provider-asset-id",
    videoPublicId: "skillora/educator-lesson",
    videoFormat: "mp4",
    videoVersion: 12345,
    durationSeconds: 60
  };
  const course = {
    educatorId: "educator-123",
    modules: { id: () => ({ lessons: { id: () => lesson } }) }
  };
  replaceMethod(context, Course, "findOne", async () => course);
  replaceMethod(context, Enrollment, "findOne", () => {
    throw new Error("Course owner playback must not require an enrollment lookup");
  });

  const result = await courseService.getLessonPlayback("educator-123", {
    courseId: "course-123",
    moduleId: "module-123",
    lessonId: "lesson-123"
  });

  assert.match(result.url, /\/video\/authenticated\//);
});

test("learning content exposes video availability but not provider asset identifiers", async (context) => {
  const lesson = {
    _id: "lesson-123",
    title: "Introduction",
    description: "",
    videoAssetId: "provider-asset-id",
    videoPublicId: "skillora/private-video",
    videoFormat: "mp4",
    videoVersion: 12345,
    durationSeconds: 60,
    isPreview: false,
    resources: []
  };
  const course = {
    _id: "course-123",
    title: "Course",
    modules: [{
      _id: "module-123",
      title: "Module",
      description: "",
      lessons: [lesson]
    }]
  };
  replaceMethod(context, Course, "findOne", async () => course);
  replaceMethod(context, Enrollment, "findOne", () => ({
    select: async () => ({ completedLessonIds: [] })
  }));

  const result = await courseService.getLearningContent("learner-123", "course-123");
  const returnedLesson = result.course.modules[0].lessons[0];

  assert.equal(returnedLesson.hasVideo, true);
  assert.equal("videoAssetId" in returnedLesson, false);
  assert.equal("videoPublicId" in returnedLesson, false);
});

test("video upload tickets cannot be used against another course or lesson", async () => {
  const uploadTicket = jwt.sign({
    sub: "educator-123",
    scope: "lesson-video-upload",
    courseId: "course-other",
    moduleId: "module-123",
    lessonId: "lesson-123",
    publicId: "skillora/private-video"
  }, process.env.JWT_ACCESS_SECRET, {
    audience: "skillora-cloudinary-upload",
    expiresIn: "5m"
  });

  await assert.rejects(
    courseService.completeLessonVideoUpload(
      "educator-123",
      { courseId: "course-123", moduleId: "module-123", lessonId: "lesson-123" },
      { uploadTicket, assetId: "provider-asset-id" }
    ),
    (error) => error.statusCode === 403
  );
});

test("preview lessons receive signed authenticated playback URLs without enrollment", async (context) => {
  const lesson = {
    isPreview: true,
    videoAssetId: "provider-asset-id",
    videoPublicId: "skillora/preview-lesson",
    videoFormat: "mp4",
    videoVersion: 12345,
    durationSeconds: 60
  };
  const course = {
    educatorId: "educator-456",
    modules: { id: () => ({ lessons: { id: () => lesson } }) }
  };
  replaceMethod(context, Course, "findOne", async () => course);
  replaceMethod(context, Enrollment, "findOne", () => {
    throw new Error("Preview playback must not require an enrollment lookup");
  });

  const result = await courseService.getLessonPlayback("learner-123", {
    courseId: "course-123",
    moduleId: "module-123",
    lessonId: "lesson-123"
  });

  assert.match(result.url, /\/video\/authenticated\/s--[^/]+--\/v12345\/skillora\/preview-lesson\.mp4/);
  assert.equal(result.durationSeconds, 60);
});
