import test from "node:test";
import assert from "node:assert/strict";
import {
  communitySettingsSchema,
  discussionSchema,
  answerSchema
} from "../src/validators/community.validator.js";

test("community access policy accepts only supported modes", () => {
  const params = { communityId: "0123456789abcdef01234567" };
  assert.equal(communitySettingsSchema.safeParse({
    params,
    body: { accessMode: "educator_responses_only" }
  }).success, true);
  assert.equal(communitySettingsSchema.safeParse({
    params,
    body: { accessMode: "admin_only" }
  }).success, false);
});

test("discussion and answer payloads require bounded non-empty content", () => {
  const communityId = "0123456789abcdef01234567";
  assert.equal(discussionSchema.safeParse({
    params: { communityId },
    body: { title: "A useful question", body: "How do I get started?" }
  }).success, true);
  assert.equal(discussionSchema.safeParse({
    params: { communityId },
    body: { title: "", body: "", role: "educator" }
  }).success, false);
  assert.equal(answerSchema.safeParse({
    params: { discussionId: communityId },
    body: { body: "Here is a useful answer." }
  }).success, true);
});
