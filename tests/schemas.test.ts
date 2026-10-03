import { describe, it, expect } from "vitest";
import { joinSchema, matchSchema } from "../lib/validation/schemas";

describe("joinSchema", () => {
  it("accepts a valid name and phone, normalizing the phone", () => {
    const result = joinSchema.safeParse({ name: "Juan Pérez", phone: "+506 8888 8888" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("88888888");
  });

  it("rejects names shorter than 2 characters", () => {
    expect(joinSchema.safeParse({ name: "J", phone: "88888888" }).success).toBe(false);
  });

  it("rejects empty names", () => {
    expect(joinSchema.safeParse({ name: "", phone: "88888888" }).success).toBe(false);
  });

  it("rejects invalid phones", () => {
    expect(joinSchema.safeParse({ name: "Juan", phone: "123" }).success).toBe(false);
  });

  it("trims surrounding whitespace from names", () => {
    const result = joinSchema.safeParse({ name: "  María  ", phone: "8888-8888" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("María");
  });
});

describe("matchSchema", () => {
  const valid = {
    match_date: "2026-10-10",
    match_time: "18:00",
    location: "Cancha Los Robles",
    price_crc: 3000,
    sinpe_phone: "88888888",
    notes: "",
  };

  it("accepts a valid match, normalizing the SINPE phone", () => {
    const result = matchSchema.safeParse({ ...valid, sinpe_phone: "+506 8888 8888" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sinpe_phone).toBe("88888888");
  });

  it("rejects a malformed date", () => {
    expect(matchSchema.safeParse({ ...valid, match_date: "10/10/2026" }).success).toBe(false);
  });

  it("rejects a malformed time", () => {
    expect(matchSchema.safeParse({ ...valid, match_time: "6pm" }).success).toBe(false);
  });

  it("rejects negative prices", () => {
    expect(matchSchema.safeParse({ ...valid, price_crc: -100 }).success).toBe(false);
  });

  it("rejects non-integer prices", () => {
    expect(matchSchema.safeParse({ ...valid, price_crc: 3000.5 }).success).toBe(false);
  });

  it("rejects short locations", () => {
    expect(matchSchema.safeParse({ ...valid, location: "C1" }).success).toBe(false);
  });

  it("rejects invalid SINPE phones", () => {
    expect(matchSchema.safeParse({ ...valid, sinpe_phone: "call-me" }).success).toBe(false);
  });

  it("allows notes to be omitted", () => {
    const { match_date, match_time, location, price_crc, sinpe_phone } = valid;
    expect(
      matchSchema.safeParse({ match_date, match_time, location, price_crc, sinpe_phone })
        .success
    ).toBe(true);
  });
});
