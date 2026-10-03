import { describe, it, expect } from "vitest";
import { formatMatchDate, formatMatchTime, formatPrice } from "../lib/format";

describe("formatMatchDate", () => {
  it("formats an ISO date in Spanish", () => {
    expect(formatMatchDate("2026-10-10")).toBe("sáb, 10 oct 2026");
  });

  it("handles a single-digit day", () => {
    expect(formatMatchDate("2026-01-05")).toBe("lun, 5 ene 2026");
  });
});

describe("formatMatchTime", () => {
  it("keeps 24h HH:MM format", () => {
    expect(formatMatchTime("18:00")).toBe("18:00");
    expect(formatMatchTime("09:30")).toBe("09:30");
  });
});

describe("formatPrice", () => {
  it("formats colones with the ₡ symbol", () => {
    expect(formatPrice(3000).startsWith("₡")).toBe(true);
    expect(formatPrice(0).startsWith("₡")).toBe(true);
  });
});
