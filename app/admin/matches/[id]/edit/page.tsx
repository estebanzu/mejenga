import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MatchForm } from "@/components/match-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setMatchStatus, updateMatch } from "@/lib/actions/matches";
import { createClient } from "@/lib/supabase/server";
import type { MatchDetail } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

function StatusCard({ match }: { match: MatchDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estado del partido</CardTitle>
        <CardDescription>
          Cancelar deja de aceptar inscripciones. El link sigue visible pero no
          deja entrar a nadie nuevo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {match.status === "open" && (
          <>
            <form action={setMatchStatus}>
              <input type="hidden" name="id" value={match.id} />
              <input type="hidden" name="to" value="finished" />
              <ConfirmSubmitButton confirmMessage="¿Marcar como finalizado?">
                Marcar finalizado
              </ConfirmSubmitButton>
            </form>
            <form action={setMatchStatus}>
              <input type="hidden" name="id" value={match.id} />
              <input type="hidden" name="to" value="cancelled" />
              <ConfirmSubmitButton
                confirmMessage="¿Cancelar el partido? Se dejarán de aceptar inscripciones."
                variant="destructive"
              >
                Cancelar partido
              </ConfirmSubmitButton>
            </form>
          </>
        )}
        {match.status === "cancelled" && (
          <form action={setMatchStatus}>
            <input type="hidden" name="id" value={match.id} />
            <input type="hidden" name="to" value="open" />
            <ConfirmSubmitButton confirmMessage="¿Reabrir el partido?">
              Reabrir partido
            </ConfirmSubmitButton>
          </form>
        )}
        {match.status === "finished" && (
          <p className="text-sm text-muted-foreground">
            Este partido ya está finalizado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

async function EditMatchContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const supabase = await createClient();
  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  const match = matchData as MatchDetail | null;
  if (!match) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/matches/${matchId}`}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Volver al partido
      </Link>
      <MatchForm
        action={updateMatch.bind(null, matchId)}
        title="Editar partido"
        description="Los cambios se ven de inmediato en el link compartido."
        submitLabel="Guardar cambios"
        defaults={{
          match_date: match.match_date,
          match_time: match.match_time,
          location: match.location,
          price_crc: match.price_crc,
          sinpe_phone: match.sinpe_phone,
          notes: match.notes ?? "",
        }}
      />
      <StatusCard match={match} />
    </div>
  );
}

export default function EditMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-6">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}
      >
        <EditMatchContent params={params} />
      </Suspense>
    </div>
  );
}
