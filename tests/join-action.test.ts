import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === "matches") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
        };
      }
      if (table === "registrations") {
        // Intentionally NO .select() chain: anon has no SELECT policy on
        // registrations, so INSERT ... RETURNING would be denied (RLS 401).
        return { insert: mockInsert };
      }
      throw new Error(`unexpected table ${table}`);
    },
  })),
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { joinMatch } from "@/lib/actions/join";
import { redirect } from "next/navigation";

const FORM = new FormData();
FORM.set("name", "Jugador Prueba");
FORM.set("phone", "88888888");

describe("joinMatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts with a generated view_token and redirects to the status page", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "m-1", status: "open" }, error: null });
    mockInsert.mockResolvedValue({ error: null });

    await joinMatch("mi-partido", { error: null }, FORM);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const row = mockInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(row.match_id).toBe("m-1");
    expect(row.name).toBe("Jugador Prueba");
    expect(row.phone).toBe("88888888");
    expect(row.view_token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(redirect).toHaveBeenCalledWith(`/m/mi-partido/p/${row.view_token}`);
  });

  it("maps duplicate phone to a friendly Spanish error", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "m-1", status: "open" }, error: null });
    mockInsert.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });

    const state = await joinMatch("mi-partido", { error: null }, FORM);

    expect(state.error).toMatch(/ya está inscrito/i);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects joining a match that is not open", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "m-1", status: "cancelled" }, error: null });

    const state = await joinMatch("mi-partido", { error: null }, FORM);

    expect(state.error).toMatch(/no está abierto/i);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns a validation error for a bad phone", async () => {
    const bad = new FormData();
    bad.set("name", "X");
    bad.set("phone", "123");

    const state = await joinMatch("mi-partido", { error: null }, bad);

    expect(state.error).toBeTruthy();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
