import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoRespuestaSchema } from "@/lib/validation";
import { logEvent } from "@/lib/logs";

// Crea una regla de respuesta automática de Instagram.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = autoRespuestaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const regla = await prisma.autoRespuesta.create({ data: parsed.data });
  await logEvent("admin", `Respuesta automática #${regla.id} creada: ${regla.nombre}`, {
    detalle: { palabrasClave: regla.palabrasClave, activa: regla.activa },
  });
  return NextResponse.json({ id: regla.id });
}
