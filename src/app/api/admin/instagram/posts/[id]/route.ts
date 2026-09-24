import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { postIGSchema } from "@/lib/validation";
import { logEvent } from "@/lib/logs";

const accionSchema = z.object({ accion: z.enum(["editar", "reintentar", "eliminar"]) });

// Estados en los que un post todavía se puede editar o borrar.
const EDITABLES = ["pendiente", "error", "descartado"] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json().catch(() => null);
  const accion = accionSchema.safeParse(body);
  if (!Number.isInteger(id) || !accion.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const post = await prisma.postIG.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
  const editable = (EDITABLES as readonly string[]).includes(post.estado);

  if (accion.data.accion === "eliminar") {
    if (!editable) {
      return NextResponse.json({ error: "Solo se pueden borrar posts pendientes, con error o descartados" }, { status: 409 });
    }
    await prisma.postIG.delete({ where: { id } });
    await logEvent("admin", `Post de Instagram #${id} eliminado`);
    return NextResponse.json({ ok: true });
  }

  if (accion.data.accion === "reintentar") {
    if (post.estado !== "error" && post.estado !== "descartado") {
      return NextResponse.json({ error: "Solo se reintentan posts con error o descartados" }, { status: 409 });
    }
    await prisma.postIG.update({
      where: { id },
      data: { estado: "pendiente", error: null, telegramMessageId: null, destino: null },
    });
    await logEvent("admin", `Post de Instagram #${id} vuelve a pendiente`);
    return NextResponse.json({ ok: true });
  }

  // editar
  if (!editable) {
    return NextResponse.json({ error: "Este post ya no se puede editar" }, { status: 409 });
  }
  const parsed = postIGSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const d = parsed.data;
  const esProducto = d.tipo === "producto";
  await prisma.postIG.update({
    where: { id },
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
      estado: "pendiente",
      error: null,
    },
  });
  await logEvent("admin", `Post de Instagram #${id} editado`);
  return NextResponse.json({ ok: true });
}
