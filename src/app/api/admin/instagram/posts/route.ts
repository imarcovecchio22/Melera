import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postIGSchema } from "@/lib/validation";
import { logEvent } from "@/lib/logs";

// Crea un post nuevo en el cronograma (queda "pendiente").
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = postIGSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const esProducto = d.tipo === "producto";
  const post = await prisma.postIG.create({
    data: {
      fecha: new Date(`${d.fecha}T00:00:00.000Z`),
      tipo: d.tipo,
      estilo: d.estilo,
      tema: d.tema,
      nombreProducto: esProducto ? d.nombreProducto : null,
      categoria: esProducto ? d.categoria || null : null,
      precio: esProducto ? d.precio : null,
      presentacion: esProducto ? d.presentacion || null : null,
      imagenUrl: esProducto ? d.imagenUrl : null,
    },
  });

  await logEvent("admin", `Post de Instagram #${post.id} creado para el ${d.fecha}`, {
    detalle: { tipo: d.tipo, estilo: d.estilo },
  });
  return NextResponse.json({ id: post.id });
}
