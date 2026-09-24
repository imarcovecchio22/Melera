import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  estado: z.enum(["nueva", "respondida", "archivada"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!Number.isInteger(id) || !parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const consulta = await prisma.consulta.update({
      where: { id },
      data: { estado: parsed.data.estado },
    });
    return NextResponse.json(consulta);
  } catch {
    return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
  }
}
