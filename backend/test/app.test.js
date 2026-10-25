import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/skillora-test";
process.env.JWT_ACCESS_SECRET = "test-only-secret-with-at-least-thirty-two-characters";
process.env.CLIENT_URL = "http://localhost:5173";

const { default: app } = await import("../src/app.js");

test("health endpoint responds without exposing configuration", async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload.data, { status: "ok", environment: "test" });
  assert.equal(JSON.stringify(payload).includes("JWT_ACCESS_SECRET"), false);
});

test("administrator endpoints require authentication", async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/courses/pending`);
  assert.equal(response.status, 401);
});

test("messaging endpoints require authentication", async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/conversations`);
  assert.equal(response.status, 401);
});

test("registration validates input before reaching persistence", async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Test User", email: "test@example.com", password: "short" })
  });
  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.message, "Request validation failed");
});
