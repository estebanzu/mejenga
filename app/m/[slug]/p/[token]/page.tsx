import { UploadProofForm } from "@/components/upload-proof-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMatchDate, formatMatchTime, formatPrice } from "@/lib/format";
import { formatCrPhone } from "@/lib/validation/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { selectBanner, canShowUpload } from "@/lib/player-view";
import type { MatchDetail, RegistrationRow } from "@/lib/types";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PlayerView = {
  match: MatchDetail;
  reg: RegistrationRow;
  proofUrl: string | null;
};

async function loadPlayerView(
  slug: string,
  token: string,
): Promise<PlayerView | null> {
  if (!UUID_RE.test(token)) return null;

  const admin = createAdminClient();

  const { data: matchData } = await admin
    .from("matches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const match = matchData as MatchDetail | null;
  if (!match) return null;

  const { data: regData, error: regError } = await admin
    .from("registrations")
    .select("id, name, phone, status, payment_proof_path, created_at")
    .eq("view_token", token)
    .eq("match_id", match.id)
    .maybeSingle();
  const reg = regData as RegistrationRow | null;
  if (regError || !reg) return null;

  let proofUrl: string | null = null;
  if (reg.payment_proof_path) {
    const { data } = await admin.storage
      .from("payment-proofs")
      .createSignedUrl(reg.payment_proof_path, 600);
    proofUrl = data?.signedUrl ?? null;
  }

  return { match, reg, proofUrl };
}

async function StatusContent({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const view = await loadPlayerView(slug, token);
  if (!view) notFound();
  const { match, reg, proofUrl } = view;

  const banner = selectBanner(match.status, reg.status);
  const showUpload = canShowUpload(match.status, reg.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{match.location}</CardTitle>
          <Badge variant={match.status === "open" ? "default" : "secondary"}>
            {match.status === "open"
              ? "Abierto"
              : match.status === "cancelled"
                ? "Cancelado"
                : "Finalizado"}
          </Badge>
        </div>
        <CardDescription>
          {formatMatchDate(match.match_date)} ·{" "}
          {formatMatchTime(match.match_time)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm">Hola, <span className="font-medium">{reg.name}</span> 👋</p>

        <div className={`rounded-lg border p-3 text-sm ${banner.className}`}>
          {banner.text}
        </div>

        {showUpload && (
          <div className="rounded-lg border bg-muted p-3 text-sm">
            <p className="mb-1 font-medium">Paso 1 — Enviá el pago</p>
            <p>
              SINPE Móvil: <span className="font-semibold">{formatCrPhone(match.sinpe_phone)}</span>
              <br />
              Monto: <span className="font-semibold">{formatPrice(match.price_crc)}</span>
            </p>
            <p className="mt-2 mb-1 font-medium">Paso 2 — Subí la captura</p>
            <UploadProofForm token={token} />
          </div>
        )}

        {proofUrl && (
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 underline underline-offset-4"
          >
            Ver comprobante enviado
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlayerStatusPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Mejenga</h1>
        </div>
        <Suspense
          fallback={
            <p className="text-center text-sm text-muted-foreground">Cargando…</p>
          }
        >
          <StatusContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}
