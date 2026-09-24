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
  origen: z.string().trim().max(50).optional().default(""),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * "@@juan", " juan ", "instagram.com/juan/" -> "juan" (sin @).
 * Devuelve "" si no queda nada.
 */
export function limpiarUsuarioInstagram(valor: string) {
  return valor
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .trim();
}

const USUARIO_INSTAGRAM = /^[a-zA-Z0-9._]{1,30}$/;

export const consultaSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "Ingresá tu nombre (mínimo 2 letras)")
      .max(80, "El nombre puede tener hasta 80 caracteres"),
    canal: z.enum(["instagram", "email"], {
      errorMap: () => ({ message: "Elegí por dónde te respondemos" }),
    }),
    instagram: z.string().optional().default(""),
    email: z.string().trim().optional().default(""),
    mensaje: z
      .string()
      .trim()
      .min(5, "Contanos un poco más en tu consulta (mínimo 5 caracteres)")
      .max(1500, "La consulta puede tener hasta 1500 caracteres"),
    origen: z.string().trim().max(50).optional().default(""),
    // anti-spam: honeypot que tiene que llegar vacío y ms desde que se abrió el form
    empresa: z.string().optional().default(""),
    tiempo: z.coerce.number().optional().default(0),
  })
  .transform((data) => ({ ...data, instagram: limpiarUsuarioInstagram(data.instagram) }))
  .superRefine((data, ctx) => {
    if (data.canal === "instagram") {
      if (!data.instagram) {
        ctx.addIssue({ code: "custom", path: ["instagram"], message: "Ingresá tu usuario de Instagram" });
      } else if (!USUARIO_INSTAGRAM.test(data.instagram)) {
        ctx.addIssue({
          code: "custom",
          path: ["instagram"],
          message: "Ese usuario de Instagram no parece válido (solo letras, números, puntos y guiones bajos)",
        });
      }
    }
    if (data.canal === "email") {
      if (!data.email) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Ingresá tu email" });
      } else if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Ingresá un email válido" });
      }
    }
  });

export type ConsultaInput = z.infer<typeof consultaSchema>;
