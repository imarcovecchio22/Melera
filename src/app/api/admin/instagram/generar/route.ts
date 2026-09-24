import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generarPendientes } from "@/lib/instagram/generar";
import { logEvent } from "@/lib/logs";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({ id: z.number().int().positive().optional() });

// "Generar ahora" desde el admin: un post puntual o los pendientes de hoy.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const resumen = await generarPendientes(parsed.data.id ? { ids: [parsed.data.id] } : {});
  await logEvent("admin", `Generación manual: ${resumen.generados} generados, ${resumen.errores} con error`, {
    detalle: resumen,
  });
  return NextResponse.json(resumen);
}
