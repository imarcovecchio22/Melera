import { NextRequest, NextResponse } from "next/server";
import { telegramApi } from "@/lib/telegram";
import { logEvent, errorMessage } from "@/lib/logs";

type WebhookInfo = { url?: string; pending_update_count?: number; last_error_message?: string };

// A qué dirección le está mandando Telegram los toques de los botones.
export async function GET() {
  try {
    const info = await telegramApi<WebhookInfo>("getWebhookInfo", {});
    return NextResponse.json({ url: info.url ?? "", pendientes: info.pending_update_count ?? 0, ultimoError: info.last_error_message ?? null });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
  }
}

// Conecta el bot a esta web: desde ahora los botones de Telegram llegan acá (y no a Make).
export async function POST(req: NextRequest) {
  const secreto = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secreto || !/^[A-Za-z0-9_-]{16,256}$/.test(secreto)) {
    return NextResponse.json(
      { error: "Falta TELEGRAM_WEBHOOK_SECRET (16+ caracteres: letras, números, _ o -)" },
      { status: 500 }
    );
  }

  // En las previews protegidas de Vercel, Telegram necesita la clave de bypass para poder entrar.
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const url = `${req.nextUrl.origin}/api/telegram/webhook${
    bypass && process.env.VERCEL_ENV !== "production" ? `?x-vercel-protection-bypass=${encodeURIComponent(bypass)}` : ""
  }`;
  try {
    await telegramApi("setWebhook", {
      url,
      secret_token: secreto,
      allowed_updates: ["callback_query"],
      drop_pending_updates: true,
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
  }
  const sinClave = url.split("?")[0];
  await logEvent("admin", `Bot de Telegram conectado a ${sinClave}`);
  return NextResponse.json({ url: sinClave });
}
