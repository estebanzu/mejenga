import { AuthButton } from "@/components/auth-button";
import { InviteAdminForm, SinpeSettingsForm } from "@/components/settings-forms";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function SettingsForms() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/auth/login");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("sinpe_phone")
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <SinpeSettingsForm currentPhone={adminRow?.sinpe_phone ?? ""} />
      <InviteAdminForm />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver
        </Link>
        <Suspense fallback={null}>
          <AuthButton />
        </Suspense>
      </header>
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}
      >
        <SettingsForms />
      </Suspense>
    </div>
  );
}
