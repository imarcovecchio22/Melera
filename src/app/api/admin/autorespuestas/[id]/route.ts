import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { autoRespuestaSchema } from "@/lib/validation";
import { logEvent } from "@/lib/logs";

type Contexto = { params: { id: string } };

const soloActivaSchema = z.object({ activa: z.boolean() });

// Edita una regla completa, o solo la activa/desactiva si el body es { activa }.
export async function PATCH(req: NextRequest, { params }: Contexto) {
  const id = Number(params.id);
  const body = await req.json().catch(() => null);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const soloActiva = body && Object.keys(body).length === 1 ? soloActivaSchema.safeParse(body) : null;
  const parsed = soloActiva?.success ? soloActiva : autoRespuestaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const regla = await prisma.autoRespuesta.update({ where: { id }, data: parsed.data });
    const accion = soloActiva?.success ? (regla.activa ? "activada" : "desactivada") : "editada";
    await logEvent("admin", `Respuesta automática #${regla.id} ${accion}: ${regla.nombre}`);
    return NextResponse.json({ id: regla.id });
  } catch {
    return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Contexto) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  try {
    const regla = await prisma.autoRespuesta.delete({ where: { id } });
    await logEvent("admin", `Respuesta automática #${regla.id} borrada: ${regla.nombre}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Regla no encontrada" }, { status: 404 });
  }
}
