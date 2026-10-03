import { describe, it, expect } from "vitest";
import { selectBanner, canShowUpload } from "../lib/player-view";

describe("selectBanner", () => {
  it("shows the cancelled notice for a cancelled match, regardless of registration", () => {
    const banner = selectBanner("cancelled", "approved");
    expect(banner.text).toMatch(/cancelado/i);
  });

  it("tells pending players they still owe a proof", () => {
    expect(selectBanner("open", "pending").text).toMatch(/falta subir/i);
  });

  it("tells players in review to come back later", () => {
    expect(selectBanner("open", "proof_submitted").text).toMatch(/revisión/i);
  });

  it("celebrates approved players", () => {
    expect(selectBanner("open", "approved").text).toMatch(/confirmado/i);
  });

  it("asks rejected players to re-upload", () => {
    expect(selectBanner("open", "rejected").text).toMatch(/rechazado/i);
  });
});

describe("canShowUpload", () => {
  it("shows upload on an open match while not approved", () => {
    expect(canShowUpload("open", "pending")).toBe(true);
    expect(canShowUpload("open", "proof_submitted")).toBe(true);
    expect(canShowUpload("open", "rejected")).toBe(true);
  });

  it("hides upload once approved", () => {
    expect(canShowUpload("open", "approved")).toBe(false);
  });

  it("hides upload when the match is cancelled or finished", () => {
    expect(canShowUpload("cancelled", "pending")).toBe(false);
    expect(canShowUpload("finished", "pending")).toBe(false);
  });
});
