import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/security";
import { errorMessage, logEvent } from "@/lib/logs";
import { sendTelegramMessage } from "@/lib/telegram";
import { generarPendientes } from "@/lib/instagram/generar";
import { estadoToken } from "@/lib/instagram/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AVISAR_DIAS_ANTES = 7;

// Vercel Cron la llama una vez por día (vercel.json) con "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || !safeEqual(req.headers.get("authorization"), `Bearer ${secreto}`)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resumen = await generarPendientes();
  await logEvent("instagram", `Corrida diaria: ${resumen.generados} generados, ${resumen.errores} con error`, {
    detalle: resumen,
  });

  // Aviso anticipado de vencimiento del token de Meta (sin él no se publica nada).
  try {
    const token = await estadoToken();
    if (!token.valido || (token.diasRestantes !== null && token.diasRestantes <= AVISAR_DIAS_ANTES)) {
      const motivo = token.valido
        ? `vence en ${token.diasRestantes} días (${token.expiraEn?.toISOString().slice(0, 10)})`
        : `no es válido: ${token.error ?? "sin detalle"}`;
      await logEvent("instagram", `Token de Meta: ${motivo}`, { nivel: "warn" });
      await sendTelegramMessage(`⚠️ El token de Meta ${motivo}. Hay que renovarlo para que se sigan publicando los posts.`);
    }
  } catch (error) {
    await logEvent("instagram", "No se pudo revisar el token de Meta", {
      nivel: "error",
      detalle: { error: errorMessage(error) },
    });
  }

  return NextResponse.json(resumen);
}
