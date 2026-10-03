import { createBrowserClient } from "@supabase/ssr";
import type { BrowserContext } from "@playwright/test";
import { env } from "./env";
import { TEST_ADMIN } from "./supabase";

type CookieJarEntry = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

function normalizeSameSite(value: unknown): "Lax" | "Strict" | "None" {
  const s = typeof value === "string" ? value.toLowerCase() : "";
  if (s === "strict") return "Strict";
  if (s === "none") return "None";
  return "Lax";
}

/**
 * Signs in with the fake E2E admin (password grant) using the real
 * @supabase/ssr client, captures the exact cookies it would set, and injects
 * them into the Playwright context — so the app sees a normal session.
 */
export async function loginAsAdmin(context: BrowserContext): Promise<void> {
  const jar: CookieJarEntry[] = [];
  const client = createBrowserClient(env.supabaseUrl, env.publishableKey, {
    isSingleton: false,
    cookies: {
      getAll: () => [],
      setAll: (items) => {
        for (const item of items) {
          jar.push(item as CookieJarEntry);
        }
      },
    },
  });

  const { error } = await client.auth.signInWithPassword({
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
  });
  if (error) {
    throw new Error(`E2E admin login failed: ${error.message}`);
  }

  const cookies = jar
    .filter((entry) => entry.value !== "")
    .map((entry) => ({
      name: entry.name,
      value: entry.value,
      domain: "localhost",
      path: typeof entry.options?.path === "string" ? entry.options.path : "/",
      httpOnly: Boolean(entry.options?.httpOnly),
      secure: false,
      sameSite: normalizeSameSite(entry.options?.sameSite),
    }));
  await context.addCookies(cookies);
}
