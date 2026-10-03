"use server";

import { createClient } from "@/lib/supabase/server";
import { matchSchema } from "@/lib/validation/schemas";
import { generateSlug } from "@/lib/validation/slug";
import { canTransitionMatch, type MatchStatus } from "@/lib/validation/match-status";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

export type MatchFormState = { error: string | null };

/**
 * Single-match policy: only one match lives at a time.
 * For every previous match: first empty its storage folder (payment proofs),
 * then delete the row (registrations cascade). A match row is only deleted
 * once its storage folder is confirmed empty, so proof screenshots can never
 * be orphaned (PII safety). Failures are logged and retried on the next
 * match creation.
 */
async function clearPreviousMatches(
  supabase: SupabaseClient,
  keepId: string,
): Promise<void> {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("id")
    .neq("id", keepId);
  if (error || !matches?.length) {
    if (error) console.error("cleanup: cannot list previous matches", error.message);
    return;
  }

  for (const match of matches) {
    const { data: files, error: listError } = await supabase.storage
      .from("payment-proofs")
      .list(match.id);
    if (listError) {
      console.error("cleanup: cannot list proofs", match.id, listError.message);
      continue;
    }
    if (files && files.length > 0) {
      const { error: removeError } = await supabase.storage
        .from("payment-proofs")
        .remove(files.map((f) => `${match.id}/${f.name}`));
      if (removeError) {
        console.error("cleanup: cannot remove proofs", match.id, removeError.message);
        continue;
      }
    }
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
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.",
    };
  }

  let createdId: string | null = null;
  let lastMessage = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("matches")
      .insert({
        slug: generateSlug(),
        match_date: parsed.data.match_date,
        match_time: parsed.data.match_time,
        location: parsed.data.location,
        price_crc: parsed.data.price_crc,
        sinpe_phone: parsed.data.sinpe_phone,
        notes: parsed.data.notes || null,
        created_by: user.sub,
      })
      .select("id")
      .single();
    if (!error && data) {
      createdId = data.id;
      break;
    }
    lastMessage = error?.message ?? "Error desconocido";
    if (error?.code !== "23505") break; // only retry unique-violation on slug
  }

  if (!createdId) {
    console.error("createMatch failed:", lastMessage);
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
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.",
    };
  }

  const { error } = await supabase
    .from("matches")
    .update({
      match_date: parsed.data.match_date,
      match_time: parsed.data.match_time,
      location: parsed.data.location,
      price_crc: parsed.data.price_crc,
      sinpe_phone: parsed.data.sinpe_phone,
      notes: parsed.data.notes || null,
    })
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
