"use client";

import { useActionState } from "react";
import type { JoinFormState } from "@/lib/actions/join";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: JoinFormState = { error: null };

export function JoinForm({
  action,
}: {
  action: (prev: JoinFormState, formData: FormData) => Promise<JoinFormState>;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          placeholder="Tu nombre"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="8888-8888"
          required
          autoComplete="tel"
        />
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Inscribiéndome…" : "Inscribirme"}
      </Button>
    </form>
  );
}
