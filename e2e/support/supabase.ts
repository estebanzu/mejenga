import { env } from "./env";

export const TEST_ADMIN = {
  email: "e2e-admin@mejenga.test",
  password: "E2e-Admin-Pass!42",
};

async function adminRest(pathname: string, init?: RequestInit): Promise<Response> {
  return fetch(`${env.supabaseUrl}${pathname}`, {
    ...init,
    headers: {
      apikey: env.serviceRoleKey,
      Authorization: `Bearer ${env.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function findTestUser(): Promise<{ id: string } | null> {
  const res = await adminRest("/auth/v1/admin/users?page=1&per_page=100");
  if (!res.ok) throw new Error(`list users failed: ${res.status}`);
  const body = (await res.json()) as { users?: { id: string; email?: string }[] };
  return body.users?.find((u) => u.email === TEST_ADMIN.email) ?? null;
}

/** Creates (or re-passwords) the fake E2E admin. Idempotent. */
export async function ensureTestAdmin(): Promise<string> {
  const existing = await findTestUser();
  if (existing) {
    const res = await adminRest(`/auth/v1/admin/users/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify({ password: TEST_ADMIN.password, email_confirm: true }),
    });
    if (!res.ok) throw new Error(`reset password failed: ${res.status}`);
    return existing.id;
  }
  const res = await adminRest("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
      email_confirm: true,
    }),
  });
  if (!res.ok) throw new Error(`create user failed: ${res.status}`);
  const body = (await res.json()) as { id: string };
  return body.id;
}

export async function getTestAdminId(): Promise<string> {
  if (process.env.E2E_ADMIN_ID) return process.env.E2E_ADMIN_ID;
  const id = await ensureTestAdmin();
  process.env.E2E_ADMIN_ID = id;
  return id;
}

/**
 * Matches NOT created by the E2E admin belong to a real user. Creating a test
 * match would delete them (single-match rule), so setup aborts unless
 * E2E_ALLOW_WIPE=1.
 */
export async function findForeignMatches(testAdminId: string): Promise<
  { id: string; location: string }[]
> {
  const res = await adminRest(
    `/rest/v1/matches?select=id,location&created_by=neq.${testAdminId}`,
  );
  if (!res.ok) throw new Error(`list matches failed: ${res.status}`);
  return (await res.json()) as { id: string; location: string }[];
}

export type E2EMatch = { id: string; slug: string };

/** Inserts an open match directly (arrange step for player specs). */
export async function createE2EMatch(adminId: string): Promise<E2EMatch> {
  const slug = `e2e-${crypto.randomUUID().slice(0, 8)}`;
  const res = await adminRest("/rest/v1/matches", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      slug,
      match_date: "2026-12-24",
      match_time: "19:00",
      location: "Cancha E2E",
      price_crc: 3000,
      sinpe_phone: "88888888",
      created_by: adminId,
    }),
  });
  if (!res.ok) throw new Error(`create match failed: ${res.status}`);
  const rows = (await res.json()) as E2EMatch[];
  return rows[0];
}

/** Empties storage and removes every E2E-owned row; deletes the test admin. */
export async function cleanupE2EData(testAdminId: string): Promise<void> {
  const res = await adminRest(
    `/rest/v1/matches?select=id&created_by=eq.${testAdminId}`,
  );
  const rows = (await res.json()) as { id: string }[];

  for (const match of rows) {
    const listRes = await adminRest("/storage/v1/object/list/payment-proofs", {
      method: "POST",
      body: JSON.stringify({ prefix: match.id }),
    });
    const listBody: unknown = await listRes.json();
    const files = (Array.isArray(listBody) ? listBody : []) as { name?: string }[];
    const paths = files
      .filter((f) => f.name)
      .map((f) => `${match.id}/${f.name}`);
    if (paths.length > 0) {
      await adminRest("/storage/v1/object/payment-proofs", {
        method: "DELETE",
        body: JSON.stringify({ prefixes: paths }),
      });
    }
  }

  if (rows.length > 0) {
    const ids = rows.map((r) => r.id).join(",");
    await adminRest(`/rest/v1/matches?id=in.(${ids})`, { method: "DELETE" });
  }

  await adminRest(`/auth/v1/admin/users/${testAdminId}`, { method: "DELETE" });
}
