import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatMatchDate, formatMatchTime, formatPrice } from "@/lib/format";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type MatchRow = {
  id: string;
  slug: string;
  match_date: string;
  match_time: string;
  location: string;
  price_crc: number;
  status: "open" | "cancelled" | "finished";
  registrations: { status: string }[];
};

const statusLabels: Record<MatchRow["status"], string> = {
  open: "Abierto",
  cancelled: "Cancelado",
  finished: "Finalizado",
};

async function MatchList() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/login");

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, slug, match_date, match_time, location, price_crc, status, registrations(status)",
    )
    .order("created_at", { ascending: false })
    .returns<MatchRow[]>();

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aún no hay partidos</CardTitle>
          <CardDescription>
            Crea un partido y comparte el link por WhatsApp para que se
            inscriban.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin/matches/new">Nuevo partido</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {matches.map((match) => {
        const total = match.registrations.length;
        const confirmed = match.registrations.filter(
          (r) => r.status === "approved",
        ).length;
        return (
          <Card key={match.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{match.location}</CardTitle>
                <Badge variant={match.status === "open" ? "default" : "secondary"}>
                  {statusLabels[match.status]}
                </Badge>
              </div>
              <CardDescription>
                {formatMatchDate(match.match_date)} ·{" "}
                {formatMatchTime(match.match_time)} · {formatPrice(match.price_crc)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {confirmed} confirmado{confirmed === 1 ? "" : "s"} de {total}{" "}
                inscrito{total === 1 ? "" : "s"}
              </p>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/matches/${match.id}`}>Ver detalle</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/admin/matches/${match.id}/edit`}>Editar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <div>
        <Button asChild>
          <Link href="/admin/matches/new">Nuevo partido</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis partidos</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Ajustes
          </Link>
          <Suspense fallback={null}>
            <AuthButton />
          </Suspense>
        </div>
      </header>

      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}
      >
        <MatchList />
      </Suspense>
    </div>
  );
}
