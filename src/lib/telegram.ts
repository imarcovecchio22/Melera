/**
 * Extrae el token ("<id numérico>:<secreto>") aunque la variable tenga texto de más
 * (comillas, prefijo "bot", el mensaje entero de BotFather, etc.).
 */
export function parseBotToken(raw?: string) {
  return raw?.match(/\d{6,}:[A-Za-z0-9_-]{30,}/)?.[0];
}

/**
 * Manda un mensaje al chat de Melera con el bot de Telegram (sin pasar por Make).
 * Si faltan TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID no hace nada; si Telegram
 * responde con error, lanza para que quien llama lo loguee.
 */
export async function sendTelegramMessage(text: string) {
  const token = parseBotToken(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim().replace(/^["']|["']$/g, "");
  if (!token || !chatId) return;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(4000),
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Telegram respondió ${res.status}: ${detail.slice(0, 200)}`);
  }
}

/** URL pública del sitio para armar links al admin. */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? "https://melera.vercel.app").replace(/\/$/, "");
}
