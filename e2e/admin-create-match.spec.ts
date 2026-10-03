import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./support/auth";

test("el admin crea un partido y obtiene el link de compartir", async ({
  page,
  context,
}) => {
  await loginAsAdmin(context);

  await page.goto("/admin");
  await page.getByRole("link", { name: "Nuevo partido" }).first().click();
  await expect(page).toHaveURL(/\/admin\/matches\/new/);

  await page.locator("#match_date").fill("2026-12-24");
  await page.locator("#match_time").fill("19:00");
  await page.locator("#location").fill("Cancha E2E Admin");
  await page.locator("#price_crc").fill("3500");
  await page.locator("#sinpe_phone").fill("88888888");
  await page.getByRole("button", { name: "Crear partido" }).click();

  await page.waitForURL(/\/admin$/);
  await expect(page.getByText("Cancha E2E Admin")).toBeVisible();

  await page.getByRole("link", { name: "Ver detalle" }).first().click();
  await expect(
    page.getByRole("link", { name: "Compartir por WhatsApp" }),
  ).toBeVisible();
  await expect(page.locator('a[href*="wa.me"]')).toHaveAttribute(
    "href",
    /wa\.me\/\?text=/,
  );
  await expect(page.getByText("Jugadores (0)")).toBeVisible();
});
