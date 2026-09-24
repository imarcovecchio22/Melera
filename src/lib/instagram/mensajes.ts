import type { BotonRegla } from "@/lib/instagram/reglas";
import { igGraph } from "@/lib/instagram/token";

/**
 * Envío de respuestas por la API de mensajería de Instagram (Instagram Login).
 * Con botones se usa la plantilla "button" (texto hasta 640 caracteres, 1 a 3
 * botones web_url); sin botones, un mensaje de texto común.
 */

type Destinatario = { id: string } | { comment_id: string };

function armarMensaje(texto: string, botones: BotonRegla[]) {
  if (botones.length === 0) return { text: texto };
  return {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: texto.slice(0, 640),
        buttons: botones.slice(0, 3).map((b) => ({ type: "web_url", url: b.url, title: b.titulo })),
      },
    },
  };
}

/** Texto con los links al final, por si Meta no acepta la plantilla con botones. */
export function textoConLinks(texto: string, botones: BotonRegla[]) {
  if (botones.length === 0) return texto;
  return `${texto}\n\n${botones.map((b) => `${b.titulo}: ${b.url}`).join("\n")}`;
}

async function enviar(recipient: Destinatario, texto: string, botones: BotonRegla[]) {
  return igGraph<{ recipient_id?: string; message_id?: string }>("me/messages", {
    json: { recipient, message: armarMensaje(texto, botones) },
  });
}

/** DM a quien escribió (tiene que ser dentro de las 24 h de su mensaje). */
export function enviarDm(igsid: string, texto: string, botones: BotonRegla[] = []) {
  return enviar({ id: igsid }, texto, botones);
}

/**
 * Respuesta privada (DM) al autor de un comentario: una sola por comentario y dentro
 * de los 7 días. Si Meta rechaza la plantilla con botones, reintenta con texto y links
 * (el intento fallido no cuenta como el mensaje enviado).
 */
export async function enviarRespuestaPrivada(commentId: string, texto: string, botones: BotonRegla[] = []) {
  try {
    return await enviar({ comment_id: commentId }, texto, botones);
  } catch (error) {
    if (botones.length === 0) throw error;
    return enviar({ comment_id: commentId }, textoConLinks(texto, botones), []);
  }
}

/** Respuesta pública debajo del comentario. */
export function responderComentario(commentId: string, texto: string) {
  return igGraph<{ id: string }>(`${encodeURIComponent(commentId)}/replies`, { json: { message: texto } });
}
