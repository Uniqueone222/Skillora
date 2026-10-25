import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSkillName, slugify } from "../src/utils/normalizeSkill.js";

test("skill names normalize whitespace and case consistently", () => {
  assert.equal(normalizeSkillName("  Motion   Graphics "), "motion graphics");
});

test("skill slugs are URL friendly", () => {
  assert.equal(slugify("  Motion Graphics & Design! "), "motion-graphics-design");
});
