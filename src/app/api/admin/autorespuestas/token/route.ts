import { NextResponse } from "next/server";
import { errorMessage, logEvent } from "@/lib/logs";
import { renovarTokenSiHaceFalta } from "@/lib/instagram/token";

export const runtime = "nodejs";

// Renueva a mano el token de las respuestas automáticas (sin esperar al cron).
export async function POST() {
  try {
    const { expiresAt } = await renovarTokenSiHaceFalta(true);
    const vence = expiresAt?.toISOString().slice(0, 10);
    await logEvent("admin", `Token de respuestas automáticas renovado a mano: vence el ${vence}`);
    return NextResponse.json({ vence });
  } catch (error) {
    await logEvent("admin", "No se pudo renovar a mano el token de respuestas automáticas", {
      nivel: "warn",
      detalle: { error: errorMessage(error) },
    });
    return NextResponse.json({ error: errorMessage(error) }, { status: 502 });
  }
}
