import { createAdminClient } from "@/lib/supabase/admin";
import { validateProofFile } from "@/lib/validation/files";
import { canTransition, type RegistrationStatus } from "@/lib/validation/status";

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status });

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Petición inválida." }, 400);
  }

  const token = String(formData.get("token") ?? "");
  const file = formData.get("file");
  if (!UUID_RE.test(token) || !(file instanceof File)) {
    return json({ error: "Faltan datos." }, 400);
  }

  const check = validateProofFile(file.type, file.size);
  if (!check.ok) return json({ error: check.message }, 400);

  const admin = createAdminClient();

  const { data: reg, error: regError } = await admin
    .from("registrations")
    .select("id, match_id, status")
    .eq("view_token", token)
    .maybeSingle();
  if (regError) {
    console.error("proof lookup failed:", regError.message);
    return json({ error: "Error interno. Intenta de nuevo." }, 500);
  }
  if (!reg) return json({ error: "Inscripción no encontrada." }, 404);
  if (reg.status === "approved") {
    return json({ error: "Ya estás confirmado. No hace falta subir nada." }, 400);
  }

  // No extension in the key: re-uploads upsert the same object, so an old
  // proof can never linger next to a new one.
  const path = `${reg.match_id}/${reg.id}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("payment-proofs")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) {
    console.error("proof upload failed:", uploadError.message);
    return json({ error: "No se pudo subir la imagen. Intenta de nuevo." }, 500);
  }

  const statusUpdate: Record<string, string> = {};
  if (reg.status !== "proof_submitted") {
    if (!canTransition(reg.status as RegistrationStatus, "proof_submitted")) {
      return json({ error: "Estado inválido para subir comprobante." }, 400);
    }
    statusUpdate.status = "proof_submitted";
  }

  const { error: updateError } = await admin
    .from("registrations")
    .update({ payment_proof_path: path, ...statusUpdate })
    .eq("id", reg.id);
  if (updateError) {
    console.error("proof update failed:", updateError.message);
    return json({ error: "Error al guardar. Intenta de nuevo." }, 500);
  }

  return json({ ok: true });
}
