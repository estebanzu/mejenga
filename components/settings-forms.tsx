"use client";

import { useActionState } from "react";
import {
  inviteAdmin,
  saveSinpe,
  type SettingsFormState,
} from "@/lib/actions/admins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initial: SettingsFormState = { error: null, notice: null };

export function SinpeSettingsForm({ currentPhone }: { currentPhone: string }) {
  const [state, formAction, isPending] = useActionState(saveSinpe, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tu número SINPE</CardTitle>
        <CardDescription>
          Se usa como valor por defecto al crear un partido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sinpe_phone">Teléfono SINPE Móvil</Label>
            <Input
              id="sinpe_phone"
              name="sinpe_phone"
              type="tel"
              inputMode="tel"
              placeholder="8888-8888"
              required
              defaultValue={currentPhone}
            />
          </div>
          {state.error && <p className="text-sm text-red-500">{state.error}</p>}
          {state.notice && <p className="text-sm text-green-600">{state.notice}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function InviteAdminForm() {
  const [state, formAction, isPending] = useActionState(inviteAdmin, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Invitar administrador</CardTitle>
        <CardDescription>
          Recibe un correo con un enlace para entrar como administrador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="amigo@correo.com"
              required
            />
          </div>
          {state.error && <p className="text-sm text-red-500">{state.error}</p>}
          {state.notice && <p className="text-sm text-green-600">{state.notice}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enviando…" : "Enviar invitación"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
