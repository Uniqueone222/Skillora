import crypto from "node:crypto";

export function verifyHmac(content, signature, secret) {
  if (typeof signature !== "string" || !/^[a-f\d]{64}$/i.test(signature) || !secret) {
    return false;
  }
  const expected = crypto.createHmac("sha256", secret).update(content).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}
