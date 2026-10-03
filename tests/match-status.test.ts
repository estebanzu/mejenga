import { describe, it, expect } from "vitest";
import { canTransitionMatch, type MatchStatus } from "../lib/validation/match-status";

describe("canTransitionMatch", () => {
  it("allows open -> cancelled", () => {
    expect(canTransitionMatch("open", "cancelled")).toBe(true);
  });

  it("allows open -> finished", () => {
    expect(canTransitionMatch("open", "finished")).toBe(true);
  });

  it("allows cancelled -> open (reopen)", () => {
    expect(canTransitionMatch("cancelled", "open")).toBe(true);
  });

  it("rejects finished -> open", () => {
    expect(canTransitionMatch("finished", "open")).toBe(false);
  });

  it("rejects cancelled -> finished", () => {
    expect(canTransitionMatch("cancelled", "finished")).toBe(false);
  });

  it("rejects same-state transitions", () => {
    expect(canTransitionMatch("open", "open")).toBe(false);
  });

  it("covers every status in the union", () => {
    const all: MatchStatus[] = ["open", "cancelled", "finished"];
    for (const from of all) {
      for (const to of all) {
        expect(typeof canTransitionMatch(from, to)).toBe("boolean");
      }
    }
  });
});
