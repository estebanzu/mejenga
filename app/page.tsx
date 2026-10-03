import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Mejenga</h1>
        <p className="max-w-md text-muted-foreground">
          Organiza tus partidos de fútbol: crea el partido, comparte el link
          por WhatsApp y cobra con SINPE Móvil. Los jugadores se inscriben y
          suben su comprobante de pago desde el teléfono.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/admin">Entrar de administrador</Link>
        </Button>
      </div>
    </main>
  );
}
