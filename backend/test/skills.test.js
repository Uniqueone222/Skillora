import test from "node:test";
import assert from "node:assert/strict";
import { skillRequestSchema } from "../src/validators/skills.validator.js";
import { normalizeSkillName, slugify } from "../src/utils/normalizeSkill.js";

test("skill suggestions normalize names consistently", () => {
  assert.equal(normalizeSkillName("  Motion   Graphics "), "motion graphics");
  assert.equal(slugify("Motion Graphics & Design!"), "motion-graphics-design");
});

test("skill suggestion input rejects malformed or unexpected fields", () => {
  assert.equal(skillRequestSchema.safeParse({
    body: { name: "Ceramic glazing", description: "" }
  }).success, true);
  assert.equal(skillRequestSchema.safeParse({
    body: { name: "x", description: "" }
  }).success, false);
  assert.equal(skillRequestSchema.safeParse({
    body: { name: "Ceramic glazing", role: "admin" }
  }).success, false);
});
