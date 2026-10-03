"use client";

import { useActionState } from "react";
import type { MatchFormState } from "@/lib/actions/matches";
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

const initialState: MatchFormState = { error: null };

const textareaClass =
  "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export type MatchDefaults = {
  match_date?: string;
  match_time?: string;
  location?: string;
  price_crc?: number;
  sinpe_phone?: string;
  notes?: string;
};

export function MatchForm({
  action,
  title,
  description,
  submitLabel,
  defaults = {},
}: {
  action: (prev: MatchFormState, formData: FormData) => Promise<MatchFormState>;
  title: string;
  description: string;
  submitLabel: string;
  defaults?: MatchDefaults;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="match_date">Fecha</Label>
            <Input
              id="match_date"
              name="match_date"
              type="date"
              required
              defaultValue={defaults.match_date}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="match_time">Hora</Label>
            <Input
              id="match_time"
              name="match_time"
              type="time"
              required
              defaultValue={defaults.match_time}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Cancha / ubicación</Label>
            <Input
              id="location"
              name="location"
              placeholder="Cancha Los Robles"
              required
              maxLength={120}
              defaultValue={defaults.location}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price_crc">Precio por persona (₡)</Label>
            <Input
              id="price_crc"
              name="price_crc"
              type="number"
              min={0}
              step={100}
              inputMode="numeric"
              placeholder="3000"
              required
              defaultValue={defaults.price_crc}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sinpe_phone">Teléfono SINPE Móvil</Label>
            <Input
              id="sinpe_phone"
              name="sinpe_phone"
              type="tel"
              inputMode="tel"
              placeholder="8888-8888"
              required
              defaultValue={defaults.sinpe_phone}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea
              id="notes"
              name="notes"
              maxLength={300}
              placeholder="Ej: traer peto negro y blanco"
              className={textareaClass}
              defaultValue={defaults.notes}
            />
          </div>
          {state.error && <p className="text-sm text-red-500">{state.error}</p>}
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
