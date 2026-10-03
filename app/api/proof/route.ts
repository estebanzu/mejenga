import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";
import { validateProofFile } from "@/lib/validation/files";
import { canTransition, type RegistrationStatus } from "@/lib/validation/status";
import type { RegistrationStatusRow } from "@/lib/types";

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status });

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Parsed =
  | { ok: true; token: string; file: File }
  | { ok: false; response: Response };

function parseProofForm(formData: FormData): Parsed {
  const token = String(formData.get("token") ?? "");
  const file = formData.get("file");
  if (!UUID_RE.test(token) || !(file instanceof File)) {
    return { ok: false, response: json({ error: "Faltan datos." }, 400) };
  }
  const check = validateProofFile(file.type, file.size);
  if (!check.ok) {
    return { ok: false, response: json({ error: check.message }, 400) };
  }
  return { ok: true, token, file };
}

type Lookup =
  | { ok: true; reg: RegistrationStatusRow }
  | { ok: false; response: Response };

async function lookupRegistration(
  admin: AdminClient,
  token: string,
): Promise<Lookup> {
  const { data, error } = await admin
    .from("registrations")
    .select("id, match_id, status")
    .eq("view_token", token)
    .maybeSingle();
  if (error) {
    console.error("proof lookup failed:", error.message);
    return {
      ok: false,
      response: json({ error: "Error interno. Intenta de nuevo." }, 500),
    };
  }
  if (!data) {
    return { ok: false, response: json({ error: "Inscripción no encontrada." }, 404) };
  }
  if (data.status === "approved") {
    return {
      ok: false,
      response: json({ error: "Ya estás confirmado. No hace falta subir nada." }, 400),
    };
  }
  return { ok: true, reg: data as RegistrationStatusRow };
}

type Stored = { ok: true } | { ok: false; response: Response };

async function storeProof(
  admin: AdminClient,
  reg: RegistrationStatusRow,
  file: File,
): Promise<Stored> {
  // No extension in the key: re-uploads upsert the same object, so an old
  // proof can never linger next to a new one.
  const path = `${reg.match_id}/${reg.id}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("payment-proofs")
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (uploadError) {
    console.error("proof upload failed:", uploadError.message);
    return {
      ok: false,
      response: json({ error: "No se pudo subir la imagen. Intenta de nuevo." }, 500),
    };
  }

  const statusUpdate: Record<string, string> = {};
  if (reg.status !== "proof_submitted") {
    if (!canTransition(reg.status as RegistrationStatus, "proof_submitted")) {
      return {
        ok: false,
        response: json({ error: "Estado inválido para subir comprobante." }, 400),
      };
    }
    statusUpdate.status = "proof_submitted";
  }

  const { error: updateError } = await admin
    .from("registrations")
    .update({ payment_proof_path: path, ...statusUpdate })
    .eq("id", reg.id);
  if (updateError) {
    console.error("proof update failed:", updateError.message);
    return {
      ok: false,
      response: json({ error: "Error al guardar. Intenta de nuevo." }, 500),
    };
  }
  return { ok: true };
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Petición inválida." }, 400);
  }

  const parsed = parseProofForm(formData);
  if (!parsed.ok) return parsed.response;

  const admin = createAdminClient();

  const lookup = await lookupRegistration(admin, parsed.token);
  if (!lookup.ok) return lookup.response;

  const stored = await storeProof(admin, lookup.reg, parsed.file);
  if (!stored.ok) return stored.response;

  return json({ ok: true });
}
