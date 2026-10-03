import { describe, it, expect } from "vitest";
import { parseCrPhone, formatCrPhone } from "../lib/validation/phone";

describe("parseCrPhone", () => {
  it("accepts a plain 8-digit number", () => {
    expect(parseCrPhone("88888888")).toBe("88888888");
  });

  it("strips dashes and spaces", () => {
    expect(parseCrPhone("8888-8888")).toBe("88888888");
    expect(parseCrPhone("8888 8888")).toBe("88888888");
  });

  it("strips the +506 country code", () => {
    expect(parseCrPhone("+506 8888 8888")).toBe("88888888");
    expect(parseCrPhone("+50688888888")).toBe("88888888");
    expect(parseCrPhone("50688888888")).toBe("88888888");
  });

  it("returns null for fewer than 8 digits", () => {
    expect(parseCrPhone("1234567")).toBeNull();
    expect(parseCrPhone("")).toBeNull();
  });

  it("returns null for more than 8 digits without country code", () => {
    expect(parseCrPhone("888888888")).toBeNull();
  });

  it("returns null for letters or symbols", () => {
    expect(parseCrPhone("call-me")).toBeNull();
    expect(parseCrPhone("8888abcd")).toBeNull();
  });
});

describe("formatCrPhone", () => {
  it("formats 8 digits with a dash", () => {
    expect(formatCrPhone("88888888")).toBe("8888-8888");
  });

  it("formats using parseCrPhone input", () => {
    expect(formatCrPhone("+506 8888 8888")).toBe("8888-8888");
  });

  it("returns the raw input when invalid", () => {
    expect(formatCrPhone("123")).toBe("123");
  });
});
