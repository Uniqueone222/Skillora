import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Skill from "../src/models/skill.model.js";
import SkillRequest from "../src/models/skillRequest.model.js";
import SkillVote from "../src/models/skillVote.model.js";
import Course from "../src/models/course.model.js";
import * as skillService from "../src/services/skill.service.js";
import { listPublishedCourses } from "../src/services/course.service.js";
import { skillRequestSchema } from "../src/validators/skills.validator.js";
import { normalizeSkillName, slugify } from "../src/utils/normalizeSkill.js";

function replaceMethod(context, target, key, replacement) {
  const original = target[key];
  target[key] = replacement;
  context.after(() => {
    target[key] = original;
  });
}

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

test("pending skill requests enforce normalized-name uniqueness with one partial index", () => {
  const normalizedNameIndexes = SkillRequest.schema.indexes()
    .filter(([fields]) => Object.keys(fields).length === 1 && fields.normalizedName === 1);

  assert.equal(normalizedNameIndexes.length, 1);
  assert.equal(normalizedNameIndexes[0][1].unique, true);
  assert.deepEqual(normalizedNameIndexes[0][1].partialFilterExpression, { status: "pending" });
});

test("skill discovery searches names and descriptions within a category", async (context) => {
  let filter;
  let limit;
  const query = {
    sort(sortBy) {
      assert.deepEqual(sortBy, { name: 1 });
      return this;
    },
    limit(value) {
      limit = value;
      return [];
    }
  };
  replaceMethod(context, Skill, "find", (value) => {
    filter = value;
    return query;
  });

  await skillService.listSkills({ search: "Clay.*", category: "Craft", limit: 12 });

  assert.equal(filter.status, "approved");
  assert.equal(filter.category, "Craft");
  assert.equal(filter.$or[0].name.$regex, "Clay\\.\\*");
  assert.deepEqual(filter.$or[0], { name: filter.$or[1].description });
  assert.equal(limit, 12);
});

test("skill request listing marks the current user's vote without exposing votes", async (context) => {
  const userId = new mongoose.Types.ObjectId();
  let pipeline;
  replaceMethod(context, SkillRequest, "aggregate", async (value) => {
    pipeline = value;
    return [];
  });

  await skillService.listRequests(userId);

  assert.deepEqual(pipeline[2].$addFields.hasVoted, { $in: [userId, "$votes.userId"] });
  assert.deepEqual(pipeline[3], { $project: { votes: 0 } });
});

test("creating a skill request records the requester's initial vote", async (context) => {
  const userId = new mongoose.Types.ObjectId();
  const request = { _id: new mongoose.Types.ObjectId() };
  let requestInput;
  let voteInput;
  replaceMethod(context, Skill, "exists", async () => false);
  replaceMethod(context, SkillRequest, "exists", async () => false);
  replaceMethod(context, SkillRequest, "create", async (input) => {
    requestInput = input;
    return request;
  });
  replaceMethod(context, SkillVote, "create", async (input) => {
    voteInput = input;
  });

  const created = await skillService.createRequest(userId, {
    name: "  Clay   Sculpting ",
    description: "Learn to shape clay"
  });

  assert.equal(created, request);
  assert.equal(requestInput.normalizedName, "clay sculpting");
  assert.equal(requestInput.suggestedBy, userId);
  assert.deepEqual(voteInput, { skillRequestId: request._id, userId });
});

test("voting requires a pending request and returns the updated count", async (context) => {
  const userId = new mongoose.Types.ObjectId();
  const requestId = new mongoose.Types.ObjectId();
  let findFilter;
  let voteInput;
  replaceMethod(context, SkillRequest, "findOne", async (filter) => {
    findFilter = filter;
    return { _id: requestId };
  });
  replaceMethod(context, SkillVote, "create", async (input) => {
    voteInput = input;
  });
  replaceMethod(context, SkillVote, "countDocuments", async () => 4);

  const result = await skillService.vote(userId, requestId);

  assert.deepEqual(findFilter, { _id: requestId, status: "pending" });
  assert.deepEqual(voteInput, { skillRequestId: requestId, userId });
  assert.deepEqual(result, { requestId, votes: 4 });
});

test("approving a skill request creates and links a catalogue skill", async (context) => {
  const adminId = new mongoose.Types.ObjectId();
  const requestId = new mongoose.Types.ObjectId();
  const skillId = new mongoose.Types.ObjectId();
  const request = {
    _id: requestId,
    name: "Motion Graphics",
    normalizedName: "motion graphics",
    description: "Animate visual designs",
    async save() {
      return this;
    }
  };
  let skillInput;
  replaceMethod(context, SkillRequest, "findOne", async (filter) => {
    assert.deepEqual(filter, { _id: requestId, status: "pending" });
    return request;
  });
  replaceMethod(context, Skill, "findOne", async () => null);
  replaceMethod(context, Skill, "create", async (input) => {
    skillInput = input;
    return { _id: skillId };
  });

  const reviewed = await skillService.reviewRequest(adminId, requestId, {
    status: "approved",
    category: "Design"
  });

  assert.equal(skillInput.slug, `motion-graphics-${requestId.toString().slice(-6)}`);
  assert.equal(skillInput.status, "approved");
  assert.equal(skillInput.description, request.description);
  assert.equal(reviewed.status, "approved");
  assert.equal(reviewed.skillId, skillId);
  assert.equal(reviewed.reviewedBy, adminId);
  assert.ok(reviewed.reviewedAt instanceof Date);
});

test("course discovery applies category, description search, difficulty, and price filters", async (context) => {
  const skillId = new mongoose.Types.ObjectId();
  let skillFilter;
  let courseFilter;
  let resultLimit;
  replaceMethod(context, Skill, "find", (filter) => {
    skillFilter = filter;
    return {
      select(fields) {
        assert.equal(fields, "_id");
        return Promise.resolve([{ _id: skillId }]);
      }
    };
  });
  replaceMethod(context, Course, "find", (filter) => {
    courseFilter = filter;
    return {
      select() { return this; },
      populate() { return this; },
      sort() { return this; },
      limit(value) {
        resultLimit = value;
        return [];
      }
    };
  });

  await listPublishedCourses({
    category: "Creative",
    search: "Clay.*",
    difficulty: "beginner",
    price: "paid",
    limit: 8
  });

  assert.deepEqual(skillFilter, { category: "Creative", status: "approved" });
  assert.deepEqual(courseFilter.skillId, { $in: [skillId] });
  assert.equal(courseFilter.status, "published");
  assert.equal(courseFilter.$or[0].title.$regex, "Clay\\.\\*");
  assert.deepEqual(courseFilter.$or[0], { title: courseFilter.$or[1].description });
  assert.equal(courseFilter.difficulty, "beginner");
  assert.deepEqual(courseFilter.pricePaise, { $gt: 0 });
  assert.equal(resultLimit, 8);
});
