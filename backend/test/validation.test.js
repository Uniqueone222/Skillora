import test from "node:test";
import assert from "node:assert/strict";
import { registerSchema } from "../src/validators/auth.validator.js";
import { createCourseSchema } from "../src/validators/courses.validator.js";

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
