import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logEvent } from "@/lib/logs";

const updateSchema = z.object({
  productId: z.string().min(1),
  stock: z.coerce.number().int().min(0),
});

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id: parsed.data.productId },
      data: { stock: parsed.data.stock },
    });
    await logEvent("admin", `Stock de ${product.nombre} cambiado a ${product.stock}`);
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
}
