"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate") || m.includes("too many")) {
    return "Demasiados intentos. Espera un minuto e intenta de nuevo.";
  }
  if (m.includes("signup") || m.includes("not allowed") || m.includes("not found")) {
    return "Este correo no está habilitado. Pide a un administrador que te invite.";
  }
  if (m.includes("invalid") || m.includes("otp")) {
    return "Código incorrecto. Verifícalo e intenta de nuevo.";
  }
  return "Ocurrió un error. Intenta de nuevo.";
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/admin`,
        },
      });
      if (error) throw error;
      setStep("code");
      setNotice(`Enviamos un código a ${email}. También puedes tocar el enlace del correo para entrar directo.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? mapAuthError(err.message) : "Ocurrió un error.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });
      if (error) throw error;
      setNotice("¡Listo! Entrando…");
      window.location.assign("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? mapAuthError(err.message) : "Ocurrió un error.");
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    const supabase = createClient();
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/admin`,
      },
    });
    if (error) setError(mapAuthError(error.message));
    else setNotice(`Enviamos otro código a ${email}.`);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Ingresa tu correo de administrador y te enviamos un código."
              : "Ingresa el código de 6 dígitos que te enviamos."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={sendCode}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando…" : "Enviar código"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={verifyCode}>
              <div className="flex flex-col gap-6">
                {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
                <div className="grid gap-2">
                  <Label htmlFor="code">Código de verificación</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
                  {isLoading ? "Verificando…" : "Verificar"}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="underline underline-offset-4 hover:text-foreground text-muted-foreground"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setError(null);
                      setNotice(null);
                    }}
                  >
                    Cambiar correo
                  </button>
                  <button
                    type="button"
                    className="underline underline-offset-4 hover:text-foreground text-muted-foreground"
                    onClick={resend}
                  >
                    Reenviar código
                  </button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
