import { describe, it, expect } from "vitest";
import { dataPurchaseSchema, airtimePurchaseSchema } from "../purchase.validators";

describe("dataPurchaseSchema", () => {
  it("accepts a valid payload", () => {
    const result = dataPurchaseSchema.safeParse({
      network: "mtn_gifting_data",
      mobile_number: "08012345678",
      plan_code: "M1GBS",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid Nigerian phone number", () => {
    const result = dataPurchaseSchema.safeParse({
      network: "mtn",
      mobile_number: "12345",
      plan_code: "M1GBS",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing plan_code", () => {
    const result = dataPurchaseSchema.safeParse({
      network: "mtn",
      mobile_number: "08012345678",
    });
    expect(result.success).toBe(false);
  });
});

describe("airtimePurchaseSchema", () => {
  it("accepts a valid payload and coerces amount to a number", () => {
    const result = airtimePurchaseSchema.safeParse({
      network: "mtn",
      mobile_number: "08012345678",
      amount: "500", // string, as it would arrive from some clients
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(500);
      expect(typeof result.data.amount).toBe("number");
    }
  });

  it("rejects a zero or negative amount", () => {
    expect(
      airtimePurchaseSchema.safeParse({ network: "mtn", mobile_number: "08012345678", amount: 0 }).success
    ).toBe(false);
    expect(
      airtimePurchaseSchema.safeParse({ network: "mtn", mobile_number: "08012345678", amount: -50 }).success
    ).toBe(false);
  });
});
