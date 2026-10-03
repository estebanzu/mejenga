const MAX_BYTES = 5 * 1024 * 1024; // matches the storage bucket limit
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type FileValidation = { ok: true } | { ok: false; message: string };

export function validateProofFile(type: string, size: number): FileValidation {
  if (!ALLOWED_TYPES.includes(type)) {
    return {
      ok: false,
      message: "Formato no válido. Usa una imagen JPG, PNG o WEBP.",
    };
  }
  if (size <= 0) {
    return { ok: false, message: "El archivo está vacío." };
  }
  if (size > MAX_BYTES) {
    return { ok: false, message: "La imagen supera los 5 MB." };
  }
  return { ok: true };
}
