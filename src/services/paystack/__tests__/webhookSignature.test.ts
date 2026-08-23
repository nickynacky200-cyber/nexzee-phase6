import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("../../../config/env", () => ({
  env: { PAYSTACK_SECRET_KEY: "test_secret_key_123" },
}));

const { verifyPaystackSignature } = await import("../webhookSignature");

function sign(body: string, secret: string) {
  return crypto.createHmac("sha512", secret).update(body).digest("hex");
}

describe("verifyPaystackSignature", () => {
  const body = Buffer.from(JSON.stringify({ event: "charge.success", data: { reference: "ref-1" } }));

  it("accepts a correctly signed payload", () => {
    const signature = sign(body.toString(), "test_secret_key_123");
    expect(verifyPaystackSignature(body, signature)).toBe(true);
  });

  it("rejects a payload signed with the wrong secret (forged request)", () => {
    const signature = sign(body.toString(), "wrong_secret");
    expect(verifyPaystackSignature(body, signature)).toBe(false);
  });

  it("rejects a tampered body even with a signature that was valid for the original body", () => {
    const signature = sign(body.toString(), "test_secret_key_123");
    const tamperedBody = Buffer.from(
      JSON.stringify({ event: "charge.success", data: { reference: "ref-1", amount: 999999999 } })
    );
    expect(verifyPaystackSignature(tamperedBody, signature)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyPaystackSignature(body, undefined)).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(verifyPaystackSignature(body, "")).toBe(false);
  });
});
