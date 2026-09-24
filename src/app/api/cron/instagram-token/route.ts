import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/security";
import { errorMessage, logEvent } from "@/lib/logs";
import { sendTelegramMessage } from "@/lib/telegram";
import { renovarTokenSiHaceFalta } from "@/lib/instagram/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Cron la llama una vez por día (vercel.json) con "Authorization: Bearer <CRON_SECRET>".
// Renueva el token de las respuestas automáticas si le quedan menos de 15 días.
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || !safeEqual(req.headers.get("authorization"), `Bearer ${secreto}`)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Sin token configurado todavía no hay nada que renovar (las respuestas automáticas no están en uso).
  if (!process.env.IG_ACCESS_TOKEN) {
    return NextResponse.json({ renovado: false, motivo: "IG_ACCESS_TOKEN no configurado" });
  }

  try {
    const resultado = await renovarTokenSiHaceFalta();
    if (resultado.renovado) {
      await logEvent("instagram", `Token de respuestas automáticas renovado: vence el ${resultado.expiresAt.toISOString().slice(0, 10)}`);
    }
    return NextResponse.json(resultado);
  } catch (error) {
    await logEvent("instagram", "No se pudo renovar el token de respuestas automáticas", {
      nivel: "error",
      detalle: { error: errorMessage(error) },
    });
    await sendTelegramMessage(
      `⚠️ No se pudo renovar el token de Instagram de las respuestas automáticas: ${errorMessage(error)}\n` +
        "Si vence, los DMs dejan de responderse solos. Renovalo desde /admin/autorespuestas o cargá uno nuevo en IG_ACCESS_TOKEN."
    ).catch(() => {});
    return NextResponse.json({ error: "No se pudo renovar" }, { status: 500 });
  }
}
