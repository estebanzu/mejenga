import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShareCard } from "@/components/share-card";
import { setRegistrationStatus } from "@/lib/actions/registrations";
import { formatMatchDate, formatMatchTime, formatPrice } from "@/lib/format";
import { formatCrPhone } from "@/lib/validation/phone";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/url";
import type { MatchDetail, RegistrationRow as RegRow } from "@/lib/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

type RegStatus = "pending" | "proof_submitted" | "approved" | "rejected";

const statusLabels: Record<RegStatus, string> = {
  pending: "Sin comprobante",
  proof_submitted: "En revisión",
  approved: "Confirmado",
  rejected: "Rechazado",
};

const badgeVariant = (s: RegStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "approved") return "default";
  if (s === "rejected") return "destructive";
  if (s === "proof_submitted") return "secondary";
  return "outline";
};

function ReviewActions({ reg, matchId }: { reg: RegRow; matchId: string }) {
  const buttonFor = (to: RegStatus, label: string, variant: "default" | "outline" | "destructive") => (
    <form action={setRegistrationStatus}>
      <input type="hidden" name="id" value={reg.id} />
      <input type="hidden" name="match_id" value={matchId} />
      <input type="hidden" name="to" value={to} />
      <Button type="submit" size="sm" variant={variant}>
        {label}
      </Button>
    </form>
  );

  switch (reg.status) {
    case "pending":
      return buttonFor("approved", "Confirmar sin comprobante", "outline");
    case "proof_submitted":
      return (
        <div className="flex gap-2">
          {buttonFor("approved", "Aprobar", "default")}
          {buttonFor("rejected", "Rechazar", "destructive")}
        </div>
      );
    case "rejected":
      return buttonFor("approved", "Aprobar", "default");
    case "approved":
      return buttonFor("rejected", "Deshacer", "destructive");
  }
}

async function MatchDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const supabase = await createClient();

  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  const match = matchData as MatchDetail | null;
  if (!match) notFound();

  const { data: regs } = await supabase
    .from("registrations")
    .select("id, name, phone, status, payment_proof_path, created_at")
    .order("created_at", { ascending: true })
    .returns<RegRow[]>();
  const registrations = regs ?? [];

  const proofUrls = new Map<string, string>();
  await Promise.all(
    registrations
      .filter((r) => r.payment_proof_path)
      .map(async (r) => {
        const { data } = await supabase.storage
          .from("payment-proofs")
          .createSignedUrl(r.payment_proof_path!, 600);
        if (data?.signedUrl) proofUrls.set(r.id, data.signedUrl);
      }),
  );

  const confirmed = registrations.filter((r) => r.status === "approved").length;
  const inReview = registrations.filter((r) => r.status === "proof_submitted").length;
  const withoutProof = registrations.filter((r) => r.status === "pending").length;
  const collected = confirmed * match.price_crc;
  const publicUrl = `${getSiteUrl()}/m/${match.slug}`;
  const dateLabel = formatMatchDate(match.match_date);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{match.location}</h1>
          <p className="text-sm text-muted-foreground">
            {dateLabel} · {formatMatchTime(match.match_time)}
          </p>
        </div>
        <Badge
          variant={match.status === "open" ? "default" : "secondary"}
        >
          {match.status === "open" ? "Abierto" : match.status === "cancelled" ? "Cancelado" : "Finalizado"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compartir inscripción</CardTitle>
          <CardDescription>
            Comparte este link por WhatsApp. Cada jugador se inscribe desde su
            teléfono.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShareCard
            location={match.location}
            dateLabel={dateLabel}
            publicUrl={publicUrl}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{confirmed}</p>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{inReview}</p>
            <p className="text-xs text-muted-foreground">En revisión</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{withoutProof}</p>
            <p className="text-xs text-muted-foreground">Sin comprobante</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{formatPrice(collected)}</p>
            <p className="text-xs text-muted-foreground">Recaudado</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Jugadores ({registrations.length})
            </CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/matches/${match.id}/edit`}>Editar partido</Link>
            </Button>
          </div>
          <CardDescription>
            Precio: {formatPrice(match.price_crc)} · SINPE:{" "}
            {formatCrPhone(match.sinpe_phone)}
            {match.notes ? ` · ${match.notes}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nadie se ha inscrito todavía. Comparte el link por WhatsApp.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {registrations.map((reg) => (
                <li
                  key={reg.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reg.name}</span>
                      <Badge variant={badgeVariant(reg.status)}>
                        {statusLabels[reg.status]}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCrPhone(reg.phone)}
                    </span>
                    {reg.payment_proof_path && proofUrls.get(reg.id) && (
                      <a
                        href={proofUrls.get(reg.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 underline underline-offset-4"
                      >
                        Ver comprobante
                      </a>
                    )}
                  </div>
                  <ReviewActions reg={reg} matchId={match.id} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-6">
      <header>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver a mis partidos
        </Link>
      </header>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}
      >
        <MatchDetailContent params={params} />
      </Suspense>
    </div>
  );
}
