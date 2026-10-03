"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crPhoneSchema, inviteEmailSchema } from "@/lib/validation/schemas";
import { getSiteUrl } from "@/lib/url";
import { revalidatePath } from "next/cache";

export type SettingsFormState = { error: string | null; notice: string | null };

const initialState: SettingsFormState = { error: null, notice: null };
export { initialState as settingsInitialState };

export async function saveSinpe(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = crPhoneSchema.safeParse(String(formData.get("sinpe_phone") ?? ""));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Número inválido.",
      notice: null,
    };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return { error: "Tu sesión expiró. Vuelve a iniciar sesión.", notice: null };
  }

  const { error } = await supabase
    .from("admins")
    .update({ sinpe_phone: parsed.data })
    .eq("id", auth.claims.sub);
  if (error) {
    console.error("saveSinpe failed:", error.message);
    return { error: "No se pudo guardar. Intenta de nuevo.", notice: null };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/matches/new");
  return { error: null, notice: "Número SINPE guardado." };
}

export async function inviteAdmin(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = inviteEmailSchema.safeParse(String(formData.get("email") ?? ""));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Correo inválido.",
      notice: null,
    };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return { error: "Tu sesión expiró. Vuelve a iniciar sesión.", notice: null };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data, {
    redirectTo: `${getSiteUrl()}/auth/confirm?next=/admin`,
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("already") || m.includes("exists")) {
      return {
        error: "Ese correo ya tiene una cuenta. Puede iniciar sesión con su código.",
        notice: null,
      };
    }
    console.error("inviteAdmin failed:", error.message);
    return { error: "No se pudo enviar la invitación. Intenta de nuevo.", notice: null };
  }

  return {
    error: null,
    notice: `Invitación enviada a ${parsed.data}.`,
  };
}
