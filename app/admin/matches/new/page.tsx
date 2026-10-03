import { MatchForm } from "@/components/match-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

async function MatchFormWithDefaults() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admins")
    .select("sinpe_phone")
    .maybeSingle();

  return <MatchForm sinpePhone={data?.sinpe_phone ?? ""} />;
}

export default function NewMatchPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-6">
      <header className="flex items-center gap-4">
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
