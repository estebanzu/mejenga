import { describe, it, expect } from "vitest";
import { validateProofFile } from "../lib/validation/files";

describe("validateProofFile", () => {
  it("accepts a jpeg under the size limit", () => {
    expect(validateProofFile("image/jpeg", 1024).ok).toBe(true);
  });

  it("accepts png and webp", () => {
    expect(validateProofFile("image/png", 1024).ok).toBe(true);
    expect(validateProofFile("image/webp", 1024).ok).toBe(true);
  });

  it("rejects other mime types", () => {
    expect(validateProofFile("application/pdf", 1024).ok).toBe(false);
    expect(validateProofFile("image/heic", 1024).ok).toBe(false);
    expect(validateProofFile("", 1024).ok).toBe(false);
  });

  it("accepts exactly the 5 MB limit", () => {
    expect(validateProofFile("image/jpeg", 5 * 1024 * 1024).ok).toBe(true);
  });

  it("rejects files over 5 MB", () => {
    const result = validateProofFile("image/jpeg", 5 * 1024 * 1024 + 1);
    expect(result).toEqual({ ok: false, message: "La imagen supera los 5 MB." });
  });

  it("rejects empty files", () => {
    expect(validateProofFile("image/jpeg", 0).ok).toBe(false);
  });
});
