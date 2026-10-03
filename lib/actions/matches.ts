"use server";

import { createClient } from "@/lib/supabase/server";
import { matchSchema, type MatchInput } from "@/lib/validation/schemas";
import { generateSlug } from "@/lib/validation/slug";
import { canTransitionMatch, type MatchStatus } from "@/lib/validation/match-status";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MatchFormState = { error: string | null };

function parseMatchForm(
  formData: FormData,
): { ok: true; data: MatchInput } | { ok: false; error: string } {
  const parsed = matchSchema.safeParse({
    match_date: String(formData.get("match_date") ?? ""),
    match_time: String(formData.get("match_time") ?? ""),
    location: String(formData.get("location") ?? ""),
    price_crc: Number(formData.get("price_crc")),
    sinpe_phone: String(formData.get("sinpe_phone") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.",
    };
  }
  return { ok: true, data: parsed.data };
}

function matchRowValues(data: MatchInput) {
  return {
    match_date: data.match_date,
    match_time: data.match_time,
    location: data.location,
    price_crc: data.price_crc,
    sinpe_phone: data.sinpe_phone,
    notes: data.notes || null,
  };
}

async function insertMatchWithSlugRetry(
  supabase: SupabaseClient,
  createdBy: string,
  data: MatchInput,
): Promise<string | null> {
  let lastMessage = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: row, error } = await supabase
      .from("matches")
      .insert({ slug: generateSlug(), ...matchRowValues(data), created_by: createdBy })
      .select("id")
      .single();
    if (!error && row) return row.id;
    lastMessage = error?.message ?? "Error desconocido";
    if (error?.code !== "23505") break; // only retry unique-violation on slug
  }
  console.error("insertMatch failed:", lastMessage);
  return null;
}

/**
 * Empties one match's storage folder. Returns true only when the folder is
 * confirmed empty, so the caller can safely delete the match row afterwards
 * (proof screenshots can never be orphaned — PII safety).
 */
async function clearMatchFolder(
  supabase: SupabaseClient,
  matchId: string,
): Promise<boolean> {
  const { data: files, error: listError } = await supabase.storage
    .from("payment-proofs")
    .list(matchId);
  if (listError) {
    console.error("cleanup: cannot list proofs", matchId, listError.message);
    return false;
  }
  if (files && files.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("payment-proofs")
      .remove(files.map((f) => `${matchId}/${f.name}`));
    if (removeError) {
      console.error("cleanup: cannot remove proofs", matchId, removeError.message);
      return false;
    }
  }
  return true;
}

/**
 * Single-match policy: only one match lives at a time.
 * For every previous match: first empty its storage folder (payment proofs),
 * then delete the row (registrations cascade). Failures are logged and
 * retried on the next match creation.
 */
async function clearPreviousMatches(
  supabase: SupabaseClient,
  keepId: string,
): Promise<void> {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id")
    .neq("id", keepId);
  if (error) {
    console.error("cleanup: cannot list previous matches", error.message);
    return;
  }

  for (const match of matches ?? []) {
    const folderEmpty = await clearMatchFolder(supabase, match.id);
    if (!folderEmpty) continue;
    const { error: deleteError } = await supabase
      .from("matches")
      .delete()
      .eq("id", match.id);
    if (deleteError) {
      console.error("cleanup: cannot delete match", match.id, deleteError.message);
    }
  }
}

export async function createMatch(
  _prevState: MatchFormState,
  formData: FormData,
): Promise<MatchFormState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const user = auth?.claims;
  if (!user) {
    return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }

  const parsed = parseMatchForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const createdId = await insertMatchWithSlugRetry(supabase, user.sub, parsed.data);
  if (!createdId) {
    return { error: "No se pudo crear el partido. Intenta de nuevo." };
  }

  await clearPreviousMatches(supabase, createdId);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateMatch(
  matchId: string,
  _prevState: MatchFormState,
  formData: FormData,
): Promise<MatchFormState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return { error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  }

  const parsed = parseMatchForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await supabase
    .from("matches")
    .update(matchRowValues(parsed.data))
    .eq("id", matchId);
  if (error) {
    console.error("updateMatch failed:", error.message);
    return { error: "No se pudieron guardar los cambios. Intenta de nuevo." };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath(`/admin/matches/${matchId}/edit`);
  redirect(`/admin/matches/${matchId}`);
}

export async function setMatchStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "") as MatchStatus;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return;

  const { data: match } = await supabase
    .from("matches")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!match) return;

  if (!canTransitionMatch(match.status as MatchStatus, to)) {
    console.error(`invalid match transition ${match.status} -> ${to}`);
    return;
  }

  const { error } = await supabase
    .from("matches")
    .update({ status: to })
    .eq("id", id);
  if (error) {
    console.error("setMatchStatus failed:", error.message);
    return;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/matches/${id}`);
  revalidatePath(`/admin/matches/${id}/edit`);
}
