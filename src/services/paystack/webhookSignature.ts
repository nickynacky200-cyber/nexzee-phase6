import crypto from "crypto";
import { env } from "../../config/env";

/**
 * Paystack's classic webhook scheme: HMAC-SHA512 of the RAW request body,
 * signed with your SECRET KEY (the same one used for API auth — Paystack
 * does not issue a separate webhook-specific secret for this scheme).
 *
 * Must be computed over the exact raw bytes Paystack sent — re-serializing
 * a parsed JSON object will very likely produce a different signature due
 * to whitespace/key-ordering differences. Callers must pass the untouched
 * request body Buffer (see app.ts's raw-body handling for the webhook route).
 */
export function verifyPaystackSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader || !env.PAYSTACK_SECRET_KEY) return false;

  const expected = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  // Constant-time comparison to avoid timing attacks on the signature check.
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signatureHeader, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
