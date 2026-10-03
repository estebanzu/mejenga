"use server";

import { createClient } from "@/lib/supabase/server";
import { joinSchema } from "@/lib/validation/schemas";
import { redirect } from "next/navigation";

export type JoinFormState = { error: string | null };

export async function joinMatch(
  slug: string,
  _prevState: JoinFormState,
  formData: FormData,
): Promise<JoinFormState> {
  const parsed = joinSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.",
    };
  }

  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!match) {
    return { error: "Partido no encontrado." };
  }
  if (match.status !== "open") {
    return { error: "Este partido ya no está abierto a inscripciones." };
  }

  const { data, error } = await supabase
    .from("registrations")
    .insert({
      match_id: match.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
    })
    .select("view_token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "Este número ya está inscrito en este partido. Revisa el link que te compartieron.",
      };
    }
    if (error.code === "42501") {
      return { error: "Este partido ya no está abierto a inscripciones." };
    }
    console.error("joinMatch failed:", error.message);
    return { error: "No se pudo completar la inscripción. Intenta de nuevo." };
  }

  redirect(`/m/${slug}/p/${data.view_token}`);
}
