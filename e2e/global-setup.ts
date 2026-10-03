import { ensureTestAdmin, findForeignMatches } from "./support/supabase";

export default async function globalSetup(): Promise<void> {
  const adminId = await ensureTestAdmin();
  process.env.E2E_ADMIN_ID = adminId;

  const foreign = await findForeignMatches(adminId);
  if (foreign.length > 0 && process.env.E2E_ALLOW_WIPE !== "1") {
    throw new Error(
      `Hay ${foreign.length} partido(s) que no son de E2E (ej: "${foreign[0].location}"). ` +
        "Correr E2E los borraría porque existe un solo partido a la vez. " +
        "Cancelá/borrá ese partido primero, o repetí con E2E_ALLOW_WIPE=1 si querés permitirlo.",
    );
  }
}
