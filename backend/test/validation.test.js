import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../src/validators/auth.validator.js";
import { createCourseSchema, courseReviewSchema } from "../src/validators/courses.validator.js";
import { courseQuerySchema } from "../src/validators/query.validator.js";
import { skillOfferSchema, skillRequestSchema } from "../src/validators/skills.validator.js";

test("registration rejects short passwords and unknown fields", () => {
  assert.equal(registerSchema.safeParse({
    body: { name: "Learner", email: "learner@example.com", password: "short" }
  }).success, false);
  assert.equal(registerSchema.safeParse({
    body: { name: "Learner", email: "learner@example.com", password: "long-enough-pass", role: "admin" }
  }).success, false);
});

test("course creation requires server-compatible integer paise values", () => {
  const input = {
    body: {
      title: "Learning illustration",
      description: "A practical course about drawing and color.",
      skillId: "0123456789abcdef01234567",
      pricePaise: 129900
    }
  };
  assert.equal(createCourseSchema.safeParse(input).success, true);
  assert.equal(createCourseSchema.safeParse({
    ...input,
    body: { ...input.body, pricePaise: 1299.5 }
  }).success, false);
  assert.equal(createCourseSchema.safeParse({
    ...input,
    body: { ...input.body, status: "published" }
  }).success, false);
});

test("course discovery filters validate supported levels and price modes", () => {
  assert.equal(courseQuerySchema.safeParse({
    query: {
      category: "Creative",
      difficulty: "intermediate",
      price: "free",
      limit: "6"
    }
  }).success, true);
  assert.equal(courseQuerySchema.safeParse({
    query: { difficulty: "expert", price: "discount" }
  }).success, false);
});

test("course review and discovery sort inputs are constrained", () => {
  const courseId = "0123456789abcdef01234567";
  assert.equal(courseReviewSchema.safeParse({
    params: { courseId },
    body: { rating: 5, body: "Clear and practical lessons." }
  }).success, true);
  assert.equal(courseReviewSchema.safeParse({
    params: { courseId },
    body: { rating: 6, body: "Clear and practical lessons." }
  }).success, false);
  assert.equal(courseReviewSchema.safeParse({
    params: { courseId },
    body: { rating: 4, body: "Short" }
  }).success, false);
  assert.equal(courseQuerySchema.safeParse({ query: { sort: "rating" } }).success, true);
  assert.equal(courseQuerySchema.safeParse({ query: { sort: "views" } }).success, false);
});

test("learner requests and educator offers accept only name and description", () => {
  const skill = { name: "Botanical illustration", description: "Watercolor plant studies." };
  assert.equal(skillRequestSchema.safeParse({ body: skill }).success, true);
  assert.equal(skillOfferSchema.safeParse({ body: skill }).success, true);
  assert.equal(skillOfferSchema.safeParse({
    body: { ...skill, intent: "learn" }
  }).success, false);
});
