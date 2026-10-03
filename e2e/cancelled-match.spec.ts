import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./support/auth";
import { createE2EMatch, getTestAdminId } from "./support/supabase";

test("cancelar el partido cierra inscripciones y avisa a los jugadores", async ({
  browser,
}) => {
  const match = await createE2EMatch(await getTestAdminId());

  // --- Jugador ya inscrito ---
  const playerCtx = await browser.newContext();
  const player = await playerCtx.newPage();
  await player.goto(`/m/${match.slug}`);
  await player.locator("#name").fill("Jugador Cancelado");
  await player.locator("#phone").fill("70000003");
  await player.getByRole("button", { name: "Inscribirme" }).click();
  await player.waitForURL(new RegExp(`/m/${match.slug}/p/`));
  await expect(player.getByText(/Falta subir el comprobante/)).toBeVisible();

  // --- Admin cancela ---
  const adminCtx = await browser.newContext();
  await loginAsAdmin(adminCtx);
  const admin = await adminCtx.newPage();
  admin.on("dialog", (dialog) => dialog.accept());
  await admin.goto(`/admin/matches/${match.id}/edit`);
  await admin.getByRole("button", { name: "Cancelar partido" }).click();
  await expect(admin.getByRole("button", { name: "Reabrir partido" })).toBeVisible();

  // --- Jugador inscrito ve el aviso y ya no puede subir ---
  await player.reload();
  await expect(player.getByText(/cancelado por el organizador/)).toBeVisible();
  await expect(player.getByText("Paso 1 — Enviá el pago")).toHaveCount(0);

  // --- El link público ya no acepta inscripciones ---
  await player.goto(`/m/${match.slug}`);
  await expect(player.getByText("Este partido fue cancelado.")).toBeVisible();
  await expect(player.getByRole("button", { name: "Inscribirme" })).toHaveCount(0);

  await adminCtx.close();
  await playerCtx.close();
});
