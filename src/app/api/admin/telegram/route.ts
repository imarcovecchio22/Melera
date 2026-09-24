import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

// Diagnóstico de los avisos por Telegram (protegido por el middleware de /api/admin).
function estado() {
  return {
    tokenConfigurado: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    chatIdConfigurado: Boolean(process.env.TELEGRAM_CHAT_ID),
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  };
}

export async function GET() {
  return NextResponse.json(estado());
}

// Manda un mensaje de prueba y devuelve el error exacto de Telegram si falla.
export async function POST() {
  const info = estado();
  if (!info.tokenConfigurado || !info.chatIdConfigurado) {
    return NextResponse.json({ ok: false, ...info, error: "Faltan variables del bot" }, { status: 500 });
  }
  try {
    await sendTelegramMessage("✅ Prueba de avisos de la web de Melera");
    return NextResponse.json({ ok: true, ...info });
  } catch (error: any) {
    return NextResponse.json({ ok: false, ...info, error: error?.message }, { status: 502 });
  }
}
