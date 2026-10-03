import { Badge } from "@/components/ui/badge";
import { JoinForm } from "@/components/join-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { joinMatch } from "@/lib/actions/join";
import { formatMatchDate, formatMatchTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { MatchDetail } from "@/lib/types";
import { notFound } from "next/navigation";
import { Suspense } from "react";

async function JoinContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const match = matchData as MatchDetail | null;
  if (!match) notFound();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{match.location}</CardTitle>
          <Badge variant={match.status === "open" ? "default" : "secondary"}>
            {match.status === "open"
              ? "Inscripciones abiertas"
              : match.status === "cancelled"
                ? "Cancelado"
                : "Finalizado"}
          </Badge>
        </div>
        <CardDescription>
          {formatMatchDate(match.match_date)} ·{" "}
          {formatMatchTime(match.match_time)} · {formatPrice(match.price_crc)}{" "}
          por persona
        </CardDescription>
        {match.notes && <CardDescription>{match.notes}</CardDescription>}
      </CardHeader>
      <CardContent>
        {match.status === "open" ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Inscribite con tu nombre y número de teléfono. Después subís el
              comprobante de SINPE Móvil.
            </p>
            <JoinForm action={joinMatch.bind(null, slug)} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {match.status === "cancelled"
              ? "Este partido fue cancelado."
              : "Las inscripciones para este partido están cerradas."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Mejenga</h1>
        </div>
        <Suspense
          fallback={<p className="text-center text-sm text-muted-foreground">Cargando…</p>}
        >
          <JoinContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}
