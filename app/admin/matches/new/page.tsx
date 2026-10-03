import { MatchForm } from "@/components/match-form";
import { createMatch } from "@/lib/actions/matches";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

async function MatchFormWithDefaults() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admins")
    .select("sinpe_phone")
    .maybeSingle();

  return (
    <MatchForm
      action={createMatch}
      title="Nuevo partido"
      description="Al crearlo se eliminan los datos del partido anterior."
      submitLabel="Crear partido"
      defaults={{ sinpe_phone: data?.sinpe_phone ?? "" }}
    />
  );
}

export default function NewMatchPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-6">
      <header>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver
        </Link>
      </header>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
        <MatchFormWithDefaults />
      </Suspense>
    </div>
  );
}
