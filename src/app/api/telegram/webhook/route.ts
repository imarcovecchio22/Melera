import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { safeEqual } from "@/lib/security";
import { errorMessage, logEvent } from "@/lib/logs";
import { answerTelegramCallback, telegramChatId } from "@/lib/telegram";
import { leerBoton } from "@/lib/instagram/botones";
import { procesarBoton } from "@/lib/instagram/aprobar";

export const runtime = "nodejs";
export const maxDuration = 60;

type CallbackQuery = {
  id: string;
  data?: string;
  from?: { id?: number };
  message?: { message_id?: number; chat?: { id?: number } };
};

// Telegram manda acá los toques de los botones. Se responde enseguida y la
// publicación sigue en segundo plano, así Telegram no reintenta el aviso.
export async function POST(req: NextRequest) {
  const secreto = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secreto || !safeEqual(req.headers.get("x-telegram-bot-api-secret-token"), secreto)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as { callback_query?: CallbackQuery } | null;
  const callback = update?.callback_query;
  if (!callback?.id) return NextResponse.json({ ok: true }); // otros tipos de update: se ignoran

  const chatId = String(callback.message?.chat?.id ?? "");
  if (!chatId || chatId !== telegramChatId()) {
    await logEvent("instagram", "Botón de Telegram desde un chat no autorizado", {
      nivel: "warn",
      detalle: { chatId, from: callback.from?.id },
    });
    return NextResponse.json({ ok: true });
  }

  const boton = leerBoton(callback.data);
  if (!boton) {
    await answerTelegramCallback(callback.id, "Este botón es del sistema anterior y ya no funciona.").catch(() => {});
    return NextResponse.json({ ok: true });
  }

  await answerTelegramCallback(callback.id, "Procesando…").catch(() => {});

  waitUntil(
    procesarBoton(boton.accion, boton.postId, callback.message?.message_id).catch((error) =>
      logEvent("instagram", `Error procesando el botón del post #${boton.postId}`, {
        nivel: "error",
        detalle: { error: errorMessage(error) },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
