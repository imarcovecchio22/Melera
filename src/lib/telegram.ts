/**
 * Extrae el token ("<id numérico>:<secreto>") aunque la variable tenga texto de más
 * (comillas, prefijo "bot", el mensaje entero de BotFather, etc.).
 */
export function parseBotToken(raw?: string) {
  return raw?.match(/\d{6,}:[A-Za-z0-9_-]{30,}/)?.[0];
}

/** Chat de Melera (el único que puede recibir avisos y tocar botones). */
export function telegramChatId() {
  return process.env.TELEGRAM_CHAT_ID?.trim().replace(/^["']|["']$/g, "") || undefined;
}

export function telegramConfigurado() {
  return Boolean(parseBotToken(process.env.TELEGRAM_BOT_TOKEN) && telegramChatId());
}

/**
 * Llama a un método de la Bot API. Lanza si falta el token o si Telegram
 * responde con error (con el motivo que devuelve Telegram).
 */
export async function telegramApi<T = unknown>(
  method: string,
  payload: Record<string, unknown>,
  timeoutMs = 10000
): Promise<T> {
  const token = parseBotToken(process.env.TELEGRAM_BOT_TOKEN);
  if (!token) throw new Error("Falta configurar TELEGRAM_BOT_TOKEN");

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
  if (!res.ok || !data?.ok) {
    throw new Error(`Telegram respondió ${res.status}: ${data?.description ?? "sin detalle"}`);
  }
  return data.result as T;
}

/**
 * Manda un mensaje al chat de Melera con el bot de Telegram (sin pasar por Make).
 * Devuelve false si faltan TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID (no manda nada);
 * si Telegram responde con error, lanza para que quien llama lo registre.
 */
export async function sendTelegramMessage(text: string) {
  const chatId = telegramChatId();
  if (!telegramConfigurado() || !chatId) return false;

  await telegramApi(
    "sendMessage",
    { chat_id: chatId, text, disable_web_page_preview: true },
    4000
  );
  return true;
}

export type BotonTelegram = { text: string; callback_data: string };

/** Manda una foto (por URL) al chat de Melera, con botones opcionales. */
export async function sendTelegramPhoto(opciones: {
  photo: string;
  caption: string;
  botones?: BotonTelegram[][];
  silencioso?: boolean;
}) {
  const result = await telegramApi<{ message_id: number }>(
    "sendPhoto",
    {
      chat_id: telegramChatId(),
      photo: opciones.photo,
      caption: opciones.caption.slice(0, 1024), // límite de Telegram para captions
      disable_notification: opciones.silencioso ?? false,
      ...(opciones.botones ? { reply_markup: { inline_keyboard: opciones.botones } } : {}),
    },
    30000 // Telegram descarga la imagen; puede tardar si se está generando
  );
  return result.message_id;
}

/** Cambia el texto de una foto ya enviada y le saca los botones. */
export async function editTelegramCaption(messageId: number, caption: string) {
  await telegramApi("editMessageCaption", {
    chat_id: telegramChatId(),
    message_id: messageId,
    caption: caption.slice(0, 1024),
    reply_markup: { inline_keyboard: [] },
  });
}

/** Confirma el toque de un botón (muestra un aviso chiquito arriba en Telegram). */
export async function answerTelegramCallback(callbackQueryId: string, text: string) {
  await telegramApi("answerCallbackQuery", { callback_query_id: callbackQueryId, text }, 4000);
}

/** URL pública del sitio para armar links al admin. */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? "https://melera.vercel.app").replace(/\/$/, "");
}
