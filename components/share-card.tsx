"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareCard({
  location,
  dateLabel,
  publicUrl,
}: {
  location: string;
  dateLabel: string;
  publicUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const message = `¡Nos vamos para ${location} el ${dateLabel}! Inscribite acá: ${publicUrl}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — user can copy manually.
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="break-all rounded-md bg-muted p-3 text-sm">{publicUrl}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={copy}>
          {copied ? "¡Copiado!" : "Copiar link"}
        </Button>
        <Button asChild>
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            Compartir por WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
