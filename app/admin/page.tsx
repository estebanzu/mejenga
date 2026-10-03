import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function MatchList() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/auth/login");

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

export default function AdminPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis partidos</h1>
        <Suspense fallback={null}>
          <AuthButton />
        </Suspense>
      </header>

      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}
      >
        <MatchList />
      </Suspense>
    </div>
  );
}
