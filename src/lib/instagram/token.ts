import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Token de la API de Instagram con Instagram Login (graph.instagram.com), el que usan
 * las respuestas automáticas. Es distinto del token de página de Facebook que usa la
 * publicación (META_PAGE_TOKEN). Dura 60 días y se renueva solo con el cron diario.
 * Nunca se loguea ni se devuelve al navegador.
 */

export const IG_GRAPH = "https://graph.instagram.com/v25.0";

// Si al token le quedan menos días que esto, el cron lo renueva.
export const RENOVAR_DIAS_ANTES = 15;

export class InstagramApiError extends Error {
  constructor(message: string, readonly codigo?: number) {
    super(message);
    this.name = "InstagramApiError";
  }
}

function huella(token: string) {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}

/**
 * Token vigente: el de la tabla InstagramToken; si está vacía (o si en Vercel se cargó
 * un IG_ACCESS_TOKEN nuevo), toma IG_ACCESS_TOKEN / IG_USER_ID del entorno y lo guarda.
 */
export async function getInstagramToken() {
  const envToken = process.env.IG_ACCESS_TOKEN?.trim();
  const envUserId = process.env.IG_USER_ID?.trim();
  const fila = await prisma.instagramToken.findUnique({ where: { id: 1 } });

  const envNuevo = envToken && envUserId && (!fila || fila.envHash !== huella(envToken));
  if (envNuevo) {
    return prisma.instagramToken.upsert({
      where: { id: 1 },
      create: { id: 1, accessToken: envToken, igUserId: envUserId, envHash: huella(envToken) },
      update: { accessToken: envToken, igUserId: envUserId, envHash: huella(envToken), expiresAt: null },
    });
  }
  if (!fila) throw new InstagramApiError("Faltan IG_ACCESS_TOKEN e IG_USER_ID (o el token en la base)");
  return fila;
}

type ErrorGraph = { error?: { message?: string; code?: number; error_subcode?: number } };

/** Llamada a graph.instagram.com con timeout y un error legible (sin el token). */
export async function igGraph<T>(
  path: string,
  opciones: { method?: "GET" | "POST"; json?: unknown; query?: Record<string, string>; token?: string } = {}
): Promise<T> {
  const token = opciones.token ?? (await getInstagramToken()).accessToken;
  const query = opciones.query ? `?${new URLSearchParams(opciones.query)}` : "";
  const base = path.startsWith("http") ? path : `${IG_GRAPH}/${path}`;

  let res: Response;
  try {
    res = await fetch(`${base}${query}`, {
      method: opciones.method ?? "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opciones.json ? { "Content-Type": "application/json" } : {}),
      },
      body: opciones.json ? JSON.stringify(opciones.json) : undefined,
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    const motivo = error instanceof Error && error.name === "TimeoutError" ? "no respondió a tiempo" : "no se pudo conectar";
    throw new InstagramApiError(`Instagram ${motivo}`);
  }

  const data = (await res.json().catch(() => null)) as (T & ErrorGraph) | null;
  if (!res.ok || !data || data.error) {
    const e = data?.error;
    throw new InstagramApiError(
      `Instagram respondió ${res.status}: ${e?.message ?? "sin detalle"}${e?.code ? ` (código ${e.code})` : ""}`,
      e?.code
    );
  }
  return data;
}

/** Días que le quedan al token (null si todavía no se sabe). */
export function diasRestantes(expiresAt: Date | null, ahora = new Date()) {
  if (!expiresAt) return null;
  return Math.floor((expiresAt.getTime() - ahora.getTime()) / 86_400_000);
}

/**
 * Renueva el token de larga duración (tiene que tener más de 24 h y no estar vencido).
 * Con forzar=false solo lo hace si le quedan menos de RENOVAR_DIAS_ANTES días o si
 * no se sabe cuándo vence.
 */
export async function renovarTokenSiHaceFalta(forzar = false) {
  const fila = await getInstagramToken();
  const dias = diasRestantes(fila.expiresAt);
  if (!forzar && dias !== null && dias >= RENOVAR_DIAS_ANTES) {
    return { renovado: false as const, expiresAt: fila.expiresAt, dias };
  }

  const data = await igGraph<{ access_token: string; expires_in: number }>(
    "https://graph.instagram.com/refresh_access_token",
    // Este endpoint documenta el token como parámetro de la URL (la URL no se loguea en ningún lado).
    { method: "GET", query: { grant_type: "ig_refresh_token", access_token: fila.accessToken }, token: fila.accessToken }
  );
  if (!data.access_token || !data.expires_in) {
    throw new InstagramApiError("Instagram no devolvió un token nuevo");
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await prisma.instagramToken.update({
    where: { id: 1 },
    data: { accessToken: data.access_token, expiresAt }, // envHash queda: sigue saliendo del mismo IG_ACCESS_TOKEN
  });
  return { renovado: true as const, expiresAt, dias: diasRestantes(expiresAt) };
}
