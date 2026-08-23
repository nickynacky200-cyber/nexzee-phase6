import { describe, it, expect } from "vitest";
import { adjustWalletSchema, suspendUserSchema } from "../adminUsers.validators";

describe("adjustWalletSchema", () => {
  it("accepts a valid credit adjustment", () => {
    const result = adjustWalletSchema.safeParse({
      amount: 500,
      direction: "credit",
      reason: "Refund goodwill gesture",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a reason under 3 characters — audit trail integrity depends on this", () => {
    const result = adjustWalletSchema.safeParse({
      amount: 500,
      direction: "credit",
      reason: "ok",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid direction value", () => {
    const result = adjustWalletSchema.safeParse({
      amount: 500,
      direction: "sideways",
      reason: "Testing invalid direction",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(
      adjustWalletSchema.safeParse({ amount: 0, direction: "credit", reason: "Zero amount test" }).success
    ).toBe(false);
    expect(
      adjustWalletSchema.safeParse({ amount: -100, direction: "debit", reason: "Negative amount test" })
        .success
    ).toBe(false);
  });

  it("rejects an unreasonably large amount (likely a fat-finger or attack)", () => {
    const result = adjustWalletSchema.safeParse({
      amount: 999_999_999,
      direction: "credit",
      reason: "Suspiciously large amount",
    });
    expect(result.success).toBe(false);
  });
});

describe("suspendUserSchema", () => {
  it("requires a reason to suspend or reactivate an account", () => {
    const result = suspendUserSchema.safeParse({ suspend: true, reason: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid suspend request", () => {
    const result = suspendUserSchema.safeParse({ suspend: true, reason: "Repeated failed KYC" });
    expect(result.success).toBe(true);
  });
});
