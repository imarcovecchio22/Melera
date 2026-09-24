import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Compara dos secretos sin filtrar información por el tiempo de respuesta
 * (se comparan los hashes, así el largo tampoco importa).
 */
export function safeEqual(a: unknown, b: unknown) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** IP del cliente según Vercel (primer valor de x-forwarded-for). */
export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "desconocida").trim();
}

/**
 * Cuenta eventos recientes de una IP en el registro de logs para limitar intentos
 * (sirve en serverless: el contador vive en la base, no en memoria).
 */
export async function demasiadosIntentos(opciones: {
  tipo: string;
  mensajeEmpiezaCon: string;
  ip: string;
  maximo: number;
  ventanaMinutos: number;
}) {
  const desde = new Date(Date.now() - opciones.ventanaMinutos * 60 * 1000);
  try {
    const cantidad = await prisma.eventLog.count({
      where: {
        tipo: opciones.tipo,
        mensaje: { startsWith: opciones.mensajeEmpiezaCon },
        createdAt: { gte: desde },
        detalle: { path: ["ip"], equals: opciones.ip },
      },
    });
    return cantidad >= opciones.maximo;
  } catch (error) {
    // Si la base falla, no bloqueamos al usuario por esto.
    console.error("No se pudo chequear el límite de intentos:", error);
    return false;
  }
}

const HOSTS_PRIVADOS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/,
  /^\[?f[cd][0-9a-f]{2}:/i,
  /\.internal$/i,
  /\.local$/i,
];

/**
 * true si la URL es https y apunta a un host público. Se usa para URLs que carga
 * el servidor (fotos de producto), así nadie puede hacer que Vercel pida
 * direcciones internas.
 */
export function esUrlPublicaHttps(valor: string) {
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  return !HOSTS_PRIVADOS.some((re) => re.test(url.hostname));
}
