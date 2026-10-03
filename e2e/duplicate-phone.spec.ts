import { test, expect } from "@playwright/test";
import { createE2EMatch, getTestAdminId } from "./support/supabase";

test("un mismo teléfono no puede inscribirse dos veces", async ({ browser }) => {
  const match = await createE2EMatch(await getTestAdminId());
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto(`/m/${match.slug}`);
  await page.locator("#name").fill("Jugador Duplicado");
  await page.locator("#phone").fill("70000002");
  await page.getByRole("button", { name: "Inscribirme" }).click();
  await page.waitForURL(new RegExp(`/m/${match.slug}/p/`));

  await page.goto(`/m/${match.slug}`);
  await page.locator("#name").fill("Jugador Duplicado");
  await page.locator("#phone").fill("70000002");
  await page.getByRole("button", { name: "Inscribirme" }).click();

  await expect(page.getByText(/ya está inscrito/)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/m/${match.slug}$`));

  await ctx.close();
});
