/**
 * Browser-only: resize + recompress an image to keep uploads well under
 * Vercel's request body limit. Returns a JPEG blob on a white background
 * (safe for transparent PNGs).
 */
export async function compressImage(
  file: File,
  maxBytes = 2 * 1024 * 1024,
): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("No se pudo leer la imagen. Usa una foto JPG o PNG.");
  }

  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let quality = 0.85;
  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  while (blob && blob.size > maxBytes && quality > 0.5) {
    quality -= 0.15;
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
  }
  if (!blob) throw new Error("No se pudo procesar la imagen.");
  return blob;
}
