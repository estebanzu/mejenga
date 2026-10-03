import { z } from "zod";
import { parseCrPhone } from "./phone";

export const crPhoneSchema = z
  .string()
  .trim()
  .refine((v) => parseCrPhone(v) !== null, { message: "Número de teléfono inválido" })
  .transform((v) => parseCrPhone(v)!);

export const inviteEmailSchema = z
  .string()
  .trim()
  .email("Correo inválido");

export const joinSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre (mínimo 2 caracteres)")
    .max(80, "Nombre demasiado largo"),
  phone: crPhoneSchema,
});
export type JoinInput = z.infer<typeof joinSchema>;

export const matchSchema = z.object({
  match_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD)"),
  match_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:MM)"),
  location: z.string().trim().min(3, "Ubicación muy corta").max(120, "Ubicación muy larga"),
  price_crc: z
    .number({ message: "Precio inválido" })
    .int("Precio debe ser un entero")
    .min(0, "Precio no puede ser negativo")
    .max(500000, "Precio demasiado alto"),
  sinpe_phone: crPhoneSchema,
  notes: z.string().trim().max(300, "Notas muy largas").optional().or(z.literal("")),
});
export type MatchInput = z.infer<typeof matchSchema>;
