import { test, expect } from "@playwright/test";
import path from "node:path";
import { loginAsAdmin } from "./support/auth";
import { createE2EMatch, getTestAdminId } from "./support/supabase";

test("flujo completo: inscripción → comprobante → aprobación del admin", async ({
  browser,
}) => {
  const match = await createE2EMatch(await getTestAdminId());

  // --- Jugador: se inscribe desde el link público ---
  const playerCtx = await browser.newContext();
  const player = await playerCtx.newPage();
  await player.goto(`/m/${match.slug}`);
  await expect(player.getByText("Cancha E2E")).toBeVisible();
  await player.locator("#name").fill("Jugador E2E");
  await player.locator("#phone").fill("70000001");
  await player.getByRole("button", { name: "Inscribirme" }).click();

  await player.waitForURL(new RegExp(`/m/${match.slug}/p/[0-9a-f-]{36}`));
  await expect(player.getByText(/Falta subir el comprobante/)).toBeVisible();

  // --- Jugador: sube el comprobante ---
  await player
    .locator("#proof")
    .setInputFiles(path.join(__dirname, "fixtures", "comprobante.png"));
  await player.getByRole("button", { name: "Subir comprobante" }).click();
  await expect(player.getByText(/Comprobante enviado/)).toBeVisible();
  await expect(player.getByText(/Comprobante en revisión/)).toBeVisible();

  // --- Admin: aprueba desde el detalle ---
  const adminCtx = await browser.newContext();
  await loginAsAdmin(adminCtx);
  const admin = await adminCtx.newPage();
  await admin.goto(`/admin/matches/${match.id}`);

  const row = admin.locator("li").filter({ hasText: "Jugador E2E" });
  await expect(row).toBeVisible();
  await expect(row.getByText("En revisión")).toBeVisible();
  await row.getByRole("button", { name: "Aprobar" }).click();
  await expect(row.getByText("Confirmado", { exact: true })).toBeVisible();
  await expect(row.getByRole("button", { name: "Deshacer" })).toBeVisible();

  // --- Jugador: ve la confirmación y ya no puede subir más ---
  await player.reload();
  await expect(player.getByText(/¡Confirmado!/)).toBeVisible();
  await expect(player.getByText("Paso 1 — Enviá el pago")).toHaveCount(0);
  await expect(player.getByText("Ver comprobante enviado")).toBeVisible();

  await adminCtx.close();
  await playerCtx.close();
});
