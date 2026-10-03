import type { MatchDetail, RegistrationRow } from "@/lib/types";

export type Banner = { text: string; className: string };

const REGISTRATION_BANNERS: Record<RegistrationRow["status"], Banner> = {
  pending: {
    text: "Inscripción registrada. Falta subir el comprobante de SINPE.",
    className: "border-yellow-300 bg-yellow-50 text-yellow-900",
  },
  proof_submitted: {
    text: "Comprobante en revisión. Vuelve a abrir este link para ver si ya fue aprobado.",
    className: "border-blue-300 bg-blue-50 text-blue-900",
  },
  approved: {
    text: "¡Confirmado! Ya tenés tu lugar en el partido.",
    className: "border-green-300 bg-green-50 text-green-900",
  },
  rejected: {
    text: "El comprobante fue rechazado. Sube otra captura.",
    className: "border-red-300 bg-red-50 text-red-900",
  },
};

const CANCELLED_BANNER: Banner = {
  text: "Este partido fue cancelado por el organizador.",
  className: "border-red-300 bg-red-50 text-red-900",
};

export function selectBanner(
  matchStatus: MatchDetail["status"],
  regStatus: RegistrationRow["status"],
): Banner {
  if (matchStatus === "cancelled") return CANCELLED_BANNER;
  return REGISTRATION_BANNERS[regStatus];
}

export function canShowUpload(
  matchStatus: MatchDetail["status"],
  regStatus: RegistrationRow["status"],
): boolean {
  return matchStatus === "open" && regStatus !== "approved";
}
