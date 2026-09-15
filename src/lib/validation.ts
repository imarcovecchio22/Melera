import { z } from "zod";

export const checkoutSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá tu nombre"),
  apellido: z.string().trim().min(1, "Ingresá tu apellido"),
  email: z.string().trim().email("Ingresá un email válido"),
  telefono: z.string().trim().min(6, "Ingresá un teléfono válido"),
  calle: z.string().trim().min(1, "Ingresá la calle"),
  numero_dir: z.string().trim().min(1, "Ingresá el número"),
  pisoDepto: z.string().trim().optional().default(""),
  localidad: z.string().trim().min(1, "Ingresá la localidad"),
  provincia: z.string().trim().min(1, "Ingresá la provincia"),
  codigoPostal: z.string().trim().min(1, "Ingresá el código postal"),
  cantidad: z.coerce.number().int().min(1, "La cantidad mínima es 1"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
