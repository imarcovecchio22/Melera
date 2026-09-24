import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logEvent } from "@/lib/logs";

const ESTADOS = [
  "pendiente",
  "pagado",
  "en_preparacion",
  "enviado",
  "entregado",
  "cancelado",
] as const;

const updateSchema = z.object({
  estado: z.enum(ESTADOS),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id: params.id },
      data: { estado: parsed.data.estado },
    });
    await logEvent("admin", `Pedido #${order.numero}: estado cambiado a ${order.estado}`);
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
}
