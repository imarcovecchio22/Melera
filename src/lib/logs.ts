import type { LogNivel, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LogTipo = "pedido" | "pago" | "consulta" | "telegram" | "admin" | "imagen" | "instagram" | "chat";

export const LOG_TIPOS: LogTipo[] = ["pedido", "pago", "consulta", "telegram", "admin", "imagen", "instagram", "chat"];

// Los eventos más viejos que esto se borran al abrir /admin/logs.
export const LOG_RETENCION_DIAS = 90;

/**
 * Registra un evento para verlo en /admin/logs. Nunca lanza: si no se puede
 * guardar, queda en la consola de Vercel y el flujo sigue normalmente.
 */
export async function logEvent(
  tipo: LogTipo,
  mensaje: string,
  opciones: { nivel?: LogNivel; detalle?: Record<string, unknown> } = {}
) {
  const nivel = opciones.nivel ?? "info";
  const consola = nivel === "error" ? console.error : nivel === "warn" ? console.warn : console.log;
  consola(`[${tipo}] ${mensaje}`, opciones.detalle ?? "");

  try {
    await prisma.eventLog.create({
      data: {
        tipo,
        nivel,
        mensaje: mensaje.slice(0, 500),
        detalle: opciones.detalle
          ? (JSON.parse(JSON.stringify(opciones.detalle)) as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (error) {
    console.error("No se pudo guardar el log:", error);
  }
}

/** Mensaje legible de cualquier error, para guardarlo en el detalle. */
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
