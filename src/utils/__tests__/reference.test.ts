import { describe, it, expect } from "vitest";
import { generateReference } from "../reference";

describe("generateReference", () => {
  it("prefixes the reference with NXZ and the given prefix", () => {
    const ref = generateReference("DA");
    expect(ref).toMatch(/^NXZ-DA-/);
  });

  it("generates unique references across many calls", () => {
    const refs = new Set(Array.from({ length: 5000 }, () => generateReference("AT")));
    expect(refs.size).toBe(5000);
  });

  it("contains no whitespace (safe to use as a URL path segment / DB key)", () => {
    const ref = generateReference("PAY");
    expect(ref).not.toMatch(/\s/);
  });
});
