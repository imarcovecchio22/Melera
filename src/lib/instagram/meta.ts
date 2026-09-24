/**
 * Publicación directa en Instagram con la Graph API de Meta (reemplaza a Buffer y a Make).
 * Usa el token de la página de Facebook vinculada a la cuenta (META_PAGE_TOKEN) y el
 * id de la cuenta de Instagram (META_IG_USER_ID).
 */

const GRAPH = "https://graph.facebook.com/v21.0";

export type TipoPublicacion = "feed" | "story";

export class MetaError extends Error {
  constructor(message: string, readonly detalle?: unknown) {
    super(message);
    this.name = "MetaError";
  }
}

function config() {
  const token = process.env.META_PAGE_TOKEN?.trim();
  const igUserId = process.env.META_IG_USER_ID?.trim();
  if (!token || !igUserId) throw new MetaError("Faltan META_PAGE_TOKEN o META_IG_USER_ID");
  return { token, igUserId };
}

/** En modo prueba se hace todo menos publicar de verdad. */
export function modoPrueba() {
  return process.env.IG_DRY_RUN === "true";
}

async function graph<T>(path: string, params: Record<string, string>, method: "GET" | "POST" = "POST") {
  const { token } = config();
  const body = new URLSearchParams({ ...params, access_token: token });
  const url = method === "GET" ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`;
  const res = await fetch(url, {
    method,
    signal: AbortSignal.timeout(20000),
    ...(method === "POST" ? { body } : {}),
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: { message?: string; code?: number } }) | null;
  if (!res.ok || !data || data.error) {
    const e = data?.error;
    throw new MetaError(
      `Meta respondió ${res.status}${e?.code ? ` (código ${e.code})` : ""}: ${e?.message ?? "sin detalle"}`,
      data
    );
  }
  return data as T;
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera a que Meta termine de procesar la imagen (en lugar de un sleep fijo). */
async function esperarContenedor(id: string, maxMs = 30000) {
  const desde = Date.now();
  while (Date.now() - desde < maxMs) {
    const estado = await graph<{ status_code?: string; status?: string }>(id, { fields: "status_code,status" }, "GET");
    if (estado.status_code === "FINISHED") return;
    if (estado.status_code === "ERROR" || estado.status_code === "EXPIRED") {
      throw new MetaError(`Meta no pudo procesar la imagen: ${estado.status ?? estado.status_code}`, estado);
    }
    await espera(2000);
  }
  throw new MetaError("Meta tardó demasiado en procesar la imagen");
}

/**
 * Publica una imagen como post del feed o como historia. Devuelve el id de la
 * publicación en Instagram.
 */
export async function publicarEnInstagram(opciones: {
  tipo: TipoPublicacion;
  imageUrl: string;
  caption?: string;
}) {
  if (modoPrueba()) return `prueba-${opciones.tipo}-${Date.now()}`;

  const { igUserId } = config();
  const contenedor = await graph<{ id: string }>(`${igUserId}/media`, {
    image_url: opciones.imageUrl,
    ...(opciones.tipo === "story" ? { media_type: "STORIES" } : { caption: opciones.caption ?? "" }),
  });
  await esperarContenedor(contenedor.id);
  const publicado = await graph<{ id: string }>(`${igUserId}/media_publish`, { creation_id: contenedor.id });
  return publicado.id;
}

/** Estado del token: si sirve y cuántos días le quedan. */
export async function estadoToken() {
  const { token } = config();
  const data = await graph<{
    data?: { is_valid?: boolean; expires_at?: number; error?: { message?: string } };
  }>("debug_token", { input_token: token }, "GET");
  const expiraEn = data.data?.expires_at ? new Date(data.data.expires_at * 1000) : null;
  return {
    valido: Boolean(data.data?.is_valid),
    expiraEn,
    diasRestantes: expiraEn ? Math.floor((expiraEn.getTime() - Date.now()) / 86400000) : null,
    error: data.data?.error?.message,
  };
}
