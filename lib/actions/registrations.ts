"use server";

import { createClient } from "@/lib/supabase/server";
import { canTransition, type RegistrationStatus } from "@/lib/validation/status";
import { revalidatePath } from "next/cache";

export async function setRegistrationStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const matchId = String(formData.get("match_id") ?? "");
  const to = String(formData.get("to") ?? "") as RegistrationStatus;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return;

  const { data: reg } = await supabase
    .from("registrations")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!reg) return;

  if (!canTransition(reg.status as RegistrationStatus, to)) {
    console.error(`invalid transition ${reg.status} -> ${to} for ${id}`);
    return;
  }

  const { error } = await supabase
    .from("registrations")
    .update({
      status: to,
      reviewed_by: auth.claims.sub,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("review failed:", error.message);
    return;
  }

  revalidatePath(`/admin/matches/${matchId}`);
}
