import crypto from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { verifyHmac } from "../src/utils/verifyHmac.js";

test("payment signatures are matched against the exact signed payload", () => {
  const payload = "order_123|payment_456";
  const secret = "local-test-secret";
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  assert.equal(verifyHmac(payload, signature, secret), true);
  assert.equal(verifyHmac(`${payload}|tampered`, signature, secret), false);
  assert.equal(verifyHmac(payload, "bad-signature", secret), false);
  assert.equal(verifyHmac(payload, signature, ""), false);
});
