import type { Consulta } from "@prisma/client";

/** Link para responder la consulta: DM de Instagram o mail. */
export function contactoHref(consulta: Pick<Consulta, "canal" | "instagram" | "email">) {
  if (consulta.canal === "instagram" && consulta.instagram) {
    return `https://ig.me/m/${consulta.instagram.replace(/^@+/, "")}`;
  }
  if (consulta.email) {
    return `mailto:${consulta.email}?subject=${encodeURIComponent("Tu consulta a Melera")}`;
  }
  return null;
}

/**
 * Avisa a Make.com (que reenvía por Telegram) que llegó una consulta nueva.
 * Best-effort: nunca debe afectar la respuesta al cliente si falla, tarda
 * o si la variable de entorno no está configurada.
 */
export async function notifyNuevaConsulta(consulta: Consulta) {
  const webhookUrl = process.env.MAKE_CONSULTA_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(4000),
    body: JSON.stringify({
      id: consulta.id,
      nombre: consulta.nombre,
      canal: consulta.canal,
      contacto: consulta.canal === "instagram" ? consulta.instagram : consulta.email,
      mensaje: consulta.mensaje,
      origen: consulta.origen,
    }),
  });
}
