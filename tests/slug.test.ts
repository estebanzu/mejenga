import { describe, it, expect } from "vitest";
import { generateSlug } from "../lib/validation/slug";

describe("generateSlug", () => {
  it("returns an 8-character slug", () => {
    expect(generateSlug()).toHaveLength(8);
  });

  it("uses only lowercase letters and digits", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateSlug()).toMatch(/^[a-z0-9]{8}$/);
    }
  });

  it("generates distinct slugs across calls", () => {
    const slugs = new Set(Array.from({ length: 200 }, () => generateSlug()));
    expect(slugs.size).toBeGreaterThan(190);
  });
});
