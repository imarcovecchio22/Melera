import type { PostIG } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorMessage, logEvent } from "@/lib/logs";
import { esUrlPublicaHttps } from "@/lib/security";
import { sendTelegramMessage, sendTelegramPhoto, siteUrl } from "@/lib/telegram";
import { generarCopy, type CopyIG } from "@/lib/instagram/copy";
import { botonesPost, hoyArgentina } from "@/lib/instagram/botones";

// Módulo CommonJS compartido con las plantillas (melera-templates/generate.js)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildImageUrls } = require("../../../melera-templates/generate");

// Cuántos posts se generan por corrida (cada uno tarda ~10-20 s; la función tiene 60 s).
export const MAX_POR_CORRIDA = 3;

/** Datos que espera la plantilla (mismos nombres que usaba la Sheet). */
export function datosPlantilla(post: PostIG, copy: CopyIG) {
  return {
    tipo: post.tipo,
    estilo: post.estilo,
    fecha: post.fecha.toISOString().slice(0, 10),
    // estilo panal: el panal del fondo se genera a partir del id del post (mismo post, misma imagen)
    ...(post.estilo === "panal" ? { semilla: String(post.id) } : {}),
    tagline: copy.tagline,
    titulo: copy.titulo,
    subtitulo: copy.subtitulo,
    cta: copy.cta,
    numero: copy.numero,
    texto_dato: copy.texto_dato,
    caracteristica_1: copy.caracteristica_1,
    caracteristica_2: copy.caracteristica_2,
    caracteristica_3: copy.caracteristica_3,
    nombre_producto: post.nombreProducto ?? "",
    precio: post.precio ?? "",
    imagen_url: post.imagenUrl ?? "",
  };
}

// Pide la imagen para que se dibuje ahora (y quede en caché) y no recién cuando la pida Telegram o Meta.
async function prepararImagen(url: string) {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(45000) });
  const tipo = res.headers.get("content-type") ?? "";
  await res.arrayBuffer().catch(() => null);
  if (!res.ok || !tipo.startsWith("image/")) {
    throw new Error(`No se pudo dibujar la imagen (${res.status})`);
  }
}

async function generarUno(post: PostIG) {
  // Candado: solo una corrida puede tomar este post.
  const tomado = await prisma.postIG.updateMany({
    where: { id: post.id, estado: "pendiente" },
    data: { estado: "generando", error: null },
  });
  if (tomado.count === 0) return "omitido" as const;

  try {
    if (post.tipo === "producto" && !esUrlPublicaHttps(post.imagenUrl ?? "")) {
      throw new Error("La foto del producto tiene que ser un link https público");
    }

    const copy = await generarCopy(post);
    const urls: { image_url: string; story_image_url: string } = buildImageUrls(
      datosPlantilla(post, copy),
      siteUrl()
    );
    await Promise.all([prepararImagen(urls.image_url), prepararImagen(urls.story_image_url)]);

    await prisma.postIG.update({
      where: { id: post.id },
      data: {
        estado: "esperando_aprobacion",
        copy,
        caption: copy.caption_ig,
        feedUrl: urls.image_url,
        storyUrl: urls.story_image_url,
        generadoEn: new Date(),
      },
    });

    const fecha = post.fecha.toISOString().slice(0, 10);
    await sendTelegramPhoto({
      photo: urls.story_image_url,
      caption: `📱 Versión historia · post #${post.id}`,
      silencioso: true,
    });
    const messageId = await sendTelegramPhoto({
      photo: urls.image_url,
      caption: `${post.tipo} (${post.estilo}) · ${fecha} · post #${post.id}\n\n${copy.caption_ig}\n\n¿Dónde lo publicamos?`,
      botones: botonesPost(post.id),
    });
    await prisma.postIG.update({ where: { id: post.id }, data: { telegramMessageId: messageId } });

    await logEvent("instagram", `Post #${post.id} generado y enviado a Telegram`, {
      detalle: { tipo: post.tipo, estilo: post.estilo, feed: urls.image_url, story: urls.story_image_url },
    });
    return "generado" as const;
  } catch (error) {
    const motivo = errorMessage(error);
    await prisma.postIG.update({ where: { id: post.id }, data: { estado: "error", error: motivo } });
    await logEvent("instagram", `Post #${post.id}: no se pudo generar`, {
      nivel: "error",
      detalle: { error: motivo },
    });
    await sendTelegramMessage(
      `⚠️ Post #${post.id} (${post.tipo} / ${post.estilo}) no se pudo generar: ${motivo}\nRevisalo en ${siteUrl()}/admin/instagram`
    ).catch(() => {});
    return "error" as const;
  }
}

/**
 * Genera los posts pendientes con fecha de hoy o anterior (o los ids indicados),
 * hasta MAX_POR_CORRIDA por vez, en paralelo.
 */
export async function generarPendientes(opciones: { ids?: number[] } = {}) {
  const hoy = new Date(`${hoyArgentina()}T00:00:00.000Z`);
  const posts = await prisma.postIG.findMany({
    where: {
      estado: "pendiente",
      ...(opciones.ids ? { id: { in: opciones.ids } } : { fecha: { lte: hoy } }),
    },
    orderBy: [{ fecha: "asc" }, { id: "asc" }],
    take: MAX_POR_CORRIDA,
  });

  const resultados = await Promise.all(posts.map((p) => generarUno(p)));
  const resumen = {
    generados: resultados.filter((r) => r === "generado").length,
    errores: resultados.filter((r) => r === "error").length,
    omitidos: resultados.filter((r) => r === "omitido").length,
  };
  const quedan = await prisma.postIG.count({
    where: { estado: "pendiente", ...(opciones.ids ? {} : { fecha: { lte: hoy } }) },
  });
  return { ...resumen, quedanPendientes: quedan };
}
