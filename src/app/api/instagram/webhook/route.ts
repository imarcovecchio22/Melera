import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { safeEqual } from "@/lib/security";
import { errorMessage, logEvent } from "@/lib/logs";
import { extraerEventos, firmaValida } from "@/lib/instagram/webhook";
import { procesarEvento } from "@/lib/instagram/autorespuestas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Verificación de Meta al configurar el webhook: devuelve hub.challenge si el token coincide.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const esperado = process.env.IG_WEBHOOK_VERIFY_TOKEN;
  if (
    params.get("hub.mode") === "subscribe" &&
    esperado &&
    safeEqual(params.get("hub.verify_token"), esperado)
  ) {
    return new NextResponse(params.get("hub.challenge") ?? "", {
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

// Meta avisa acá los DMs y comentarios. Se responde 200 enseguida y las respuestas
// salen en segundo plano; los errores quedan en InstagramEvento y no cortan el aviso.
export async function POST(req: NextRequest) {
  const bodyCrudo = await req.text();
  if (!firmaValida(bodyCrudo, req.headers.get("x-hub-signature-256"), process.env.IG_APP_SECRET)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyCrudo);
  } catch {
    return NextResponse.json({ received: true });
  }

  const eventos = extraerEventos(payload);
  if (eventos.length > 0) {
    // De a uno: si el mismo usuario mandó dos mensajes juntos, el segundo ya ve la respuesta del primero.
    const procesarTodos = async () => {
      for (const ev of eventos) await procesarEvento(ev);
    };
    waitUntil(
      procesarTodos().catch((error) =>
        logEvent("instagram", "Error procesando un aviso del webhook de Instagram", {
          nivel: "error",
          detalle: { error: errorMessage(error) },
        })
      )
    );
  }
  return NextResponse.json({ received: true });
}
