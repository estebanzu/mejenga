"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImage } from "@/lib/image";

export function UploadProofForm({ token }: { token: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setNotice(null);
    try {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.set("token", token);
      fd.set("file", new File([blob], "comprobante.jpg", { type: "image/jpeg" }));

      const res = await fetch("/api/proof", { method: "POST", body: fd });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? "No se pudo subir la imagen.");
      }
      setFile(null);
      setNotice("Comprobante enviado. Espera la confirmación del organizador.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="proof">Comprobante de pago (imagen)</Label>
        <Input
          id="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
            setNotice(null);
          }}
        />
        {file && (
          <p className="text-sm text-muted-foreground">{file.name}</p>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {notice && <p className="text-sm text-green-600">{notice}</p>}
      <Button type="submit" disabled={!file || isUploading}>
        {isUploading ? "Subiendo…" : "Subir comprobante"}
      </Button>
    </form>
  );
}
