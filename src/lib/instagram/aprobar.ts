import { prisma } from "@/lib/prisma";
import { errorMessage, logEvent } from "@/lib/logs";
import { editTelegramCaption, sendTelegramMessage } from "@/lib/telegram";
import { modoPrueba, publicarEnInstagram } from "@/lib/instagram/meta";
import { DESTINO_LABEL, type AccionBoton } from "@/lib/instagram/botones";

/**
 * Procesa el botón que se tocó en Telegram para un post. Idempotente: si el post
 * ya no está esperando aprobación (otro toque llegó antes), no hace nada.
 */
export async function procesarBoton(accion: AccionBoton, postId: number, messageId?: number) {
  if (accion === "descartar") {
    const tomado = await prisma.postIG.updateMany({
      where: { id: postId, estado: "esperando_aprobacion" },
      data: { estado: "descartado" },
    });
    if (tomado.count === 0) return;
    await logEvent("instagram", `Post #${postId} descartado`);
    if (messageId) await editTelegramCaption(messageId, "❌ Descartado").catch(() => {});
    return;
  }

  // Candado: pasar a "publicando" es atómico, así un segundo toque no publica dos veces.
  const tomado = await prisma.postIG.updateMany({
    where: { id: postId, estado: "esperando_aprobacion" },
    data: { estado: "publicando", destino: accion },
  });
  if (tomado.count === 0) return;

  const post = await prisma.postIG.findUniqueOrThrow({ where: { id: postId } });
  const quiereFeed = accion !== "story";
  const quiereStory = accion !== "feed";
  const fallas: string[] = [];
  let feedMediaId: string | null = null;
  let storyMediaId: string | null = null;

  if (quiereFeed) {
    try {
      feedMediaId = await publicarEnInstagram({ tipo: "feed", imageUrl: post.feedUrl!, caption: post.caption ?? "" });
    } catch (error) {
      fallas.push(`Feed: ${errorMessage(error)}`);
    }
  }
  if (quiereStory) {
    try {
      storyMediaId = await publicarEnInstagram({ tipo: "story", imageUrl: post.storyUrl! });
    } catch (error) {
      fallas.push(`Historia: ${errorMessage(error)}`);
    }
  }

  const algoSalio = Boolean(feedMediaId || storyMediaId);
  const prueba = modoPrueba() ? " (prueba, no se publicó de verdad)" : "";

  if (!algoSalio) {
    // No salió nada: vuelve a quedar esperando, con los botones, para poder reintentar.
    await prisma.postIG.update({
      where: { id: postId },
      data: { estado: "esperando_aprobacion", destino: null, error: fallas.join(" · ") },
    });
    await logEvent("instagram", `Post #${postId}: no se pudo publicar`, { nivel: "error", detalle: { fallas } });
    await sendTelegramMessage(
      `⚠️ El post #${postId} no se publicó. Podés volver a tocar un botón.\n\n${fallas.join("\n")}\n\nSi dice OAuthException, entrá a Facebook y completá la verificación que pida.`
    ).catch(() => {});
    return;
  }

  await prisma.postIG.update({
    where: { id: postId },
    data: {
      estado: "publicado",
      feedMediaId,
      storyMediaId,
      publicadoEn: new Date(),
      error: fallas.length ? fallas.join(" · ") : null,
    },
  });
  await logEvent("instagram", `Post #${postId} publicado en ${DESTINO_LABEL[accion]}${prueba}`, {
    nivel: fallas.length ? "warn" : "info",
    detalle: { feedMediaId, storyMediaId, fallas },
  });

  if (messageId) {
    const encabezado = `✅ Publicado en ${DESTINO_LABEL[accion]}${prueba}`;
    const avisos = fallas.length ? `\n⚠️ ${fallas.join("\n⚠️ ")}` : "";
    await editTelegramCaption(messageId, `${encabezado}${avisos}\n\n${post.caption ?? ""}`).catch(() => {});
  }
  if (fallas.length) {
    await sendTelegramMessage(
      `⚠️ El post #${postId} salió solo en parte.\n\n${fallas.join("\n")}\n\nSi dice OAuthException, entrá a Facebook y completá la verificación que pida.`
    ).catch(() => {});
  }
}
