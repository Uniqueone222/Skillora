import crypto from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { verifyHmac } from "../src/utils/verifyHmac.js";
import { captureIfAuthorizedPayment } from "../src/services/payment.service.js";

test("payment signatures are matched against the exact signed payload", () => {
  const payload = "order_123|payment_456";
  const secret = "local-test-secret";
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  assert.equal(verifyHmac(payload, signature, secret), true);
  assert.equal(verifyHmac(`${payload}|tampered`, signature, secret), false);
  assert.equal(verifyHmac(payload, "bad-signature", secret), false);
  assert.equal(verifyHmac(payload, signature, ""), false);
});

test("authorized Razorpay payments are captured before course fulfillment", async () => {
  const expected = { orderId: "order_test", amount: 49900, currency: "INR" };
  const calls = [];
  const razorpay = {
    payments: {
      async fetch(paymentId) {
        calls.push(["fetch", paymentId]);
        return { id: paymentId, order_id: expected.orderId, amount: expected.amount, currency: expected.currency, status: "authorized" };
      },
      async capture(paymentId, amount, currency) {
        calls.push(["capture", paymentId, amount, currency]);
        return { id: paymentId, order_id: expected.orderId, amount, currency, status: "captured" };
      }
    }
  };

  const result = await captureIfAuthorizedPayment(razorpay, "pay_test", expected);

  assert.equal(result.status, "captured");
  assert.deepEqual(calls, [
    ["fetch", "pay_test"],
    ["capture", "pay_test", expected.amount, expected.currency]
  ]);
});

test("Razorpay payments for another order are rejected before capture", async () => {
  let captured = false;
  const razorpay = {
    payments: {
      async fetch() {
        return { order_id: "another_order", amount: 49900, currency: "INR", status: "authorized" };
      },
      async capture() {
        captured = true;
      }
    }
  };

  await assert.rejects(
    captureIfAuthorizedPayment(razorpay, "pay_test", {
      orderId: "order_test",
      amount: 49900,
      currency: "INR"
    }),
    { statusCode: 409 }
  );
  assert.equal(captured, false);
});

test("a payment captured concurrently is accepted after a capture retry error", async () => {
  const expected = { orderId: "order_test", amount: 49900, currency: "INR" };
  let fetches = 0;
  const razorpay = {
    payments: {
      async fetch(paymentId) {
        fetches += 1;
        return {
          id: paymentId,
          order_id: expected.orderId,
          amount: expected.amount,
          currency: expected.currency,
          status: fetches === 1 ? "authorized" : "captured"
        };
      },
      async capture() {
        throw Object.assign(new Error("Payment was already captured"), { statusCode: 400 });
      }
    }
  };

  const result = await captureIfAuthorizedPayment(razorpay, "pay_test", expected);

  assert.equal(result.status, "captured");
  assert.equal(fetches, 2);
});
