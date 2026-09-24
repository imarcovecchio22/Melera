import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/logs";
import { reiniciarLimite } from "@/lib/instagram/autorespuestas";

const schema = z.object({ usuarioIgId: z.string().trim().regex(/^\d{1,40}$/) });

// Para pruebas: la próxima vez que esta cuenta escriba se le responde, aunque no hayan pasado las horas.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const liberadas = await reiniciarLimite(parsed.data.usuarioIgId);
  await logEvent("admin", "Límite de respuestas automáticas reiniciado para una cuenta de Instagram", {
    detalle: { usuarioIgId: parsed.data.usuarioIgId, liberadas },
  });
  return NextResponse.json({ liberadas });
}
