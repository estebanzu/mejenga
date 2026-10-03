import { describe, it, expect } from "vitest";
import { canTransition, type RegistrationStatus } from "../lib/validation/status";

describe("canTransition (registration status machine)", () => {
  it("allows pending -> proof_submitted (player uploads proof)", () => {
    expect(canTransition("pending", "proof_submitted")).toBe(true);
  });

  it("allows pending -> approved (admin confirms without proof, cash)", () => {
    expect(canTransition("pending", "approved")).toBe(true);
  });

  it("allows proof_submitted -> approved", () => {
    expect(canTransition("proof_submitted", "approved")).toBe(true);
  });

  it("allows proof_submitted -> rejected", () => {
    expect(canTransition("proof_submitted", "rejected")).toBe(true);
  });

  it("allows rejected -> proof_submitted (player re-uploads)", () => {
    expect(canTransition("rejected", "proof_submitted")).toBe(true);
  });

  it("allows rejected -> approved (admin approves after checking outside the app)", () => {
    expect(canTransition("rejected", "approved")).toBe(true);
  });

  it("allows approved -> rejected (admin fixes a mis-click)", () => {
    expect(canTransition("approved", "rejected")).toBe(true);
  });

  it("rejects same-state transitions", () => {
    expect(canTransition("pending", "pending")).toBe(false);
    expect(canTransition("approved", "approved")).toBe(false);
  });

  it("rejects pending -> rejected (nothing to review yet)", () => {
    expect(canTransition("pending", "rejected")).toBe(false);
  });

  it("rejects proof_submitted -> pending", () => {
    expect(canTransition("proof_submitted", "pending")).toBe(false);
  });

  it("rejects approved -> pending and approved -> proof_submitted", () => {
    expect(canTransition("approved", "pending")).toBe(false);
    expect(canTransition("approved", "proof_submitted")).toBe(false);
  });

  it("covers every status in the union", () => {
    const all: RegistrationStatus[] = ["pending", "proof_submitted", "approved", "rejected"];
    for (const from of all) {
      for (const to of all) {
        expect(typeof canTransition(from, to)).toBe("boolean");
      }
    }
  });
});
