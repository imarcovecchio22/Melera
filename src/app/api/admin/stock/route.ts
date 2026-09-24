import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logEvent } from "@/lib/logs";
import { formatPrecio } from "@/lib/utils";

const updateSchema = z.object({
  productId: z.string().min(1),
  stock: z.coerce.number().int().min(0),
  // Precio del frasco en pesos (se usa en la tienda, en /consultas, en el chat y en las respuestas de Instagram)
  precio: z.coerce.number().int("El precio va sin centavos").min(1, "El precio tiene que ser mayor a 0").max(10_000_000).optional(),
});

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { productId, stock, precio } = parsed.data;
  try {
    const anterior = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    const product = await prisma.product.update({
      where: { id: productId },
      data: { stock, ...(precio !== undefined ? { precio } : {}) },
    });
    if (product.stock !== anterior.stock) {
      await logEvent("admin", `Stock de ${product.nombre} cambiado a ${product.stock}`);
    }
    if (product.precio !== anterior.precio) {
      await logEvent("admin", `Precio de ${product.nombre} cambiado de ${formatPrecio(anterior.precio)} a ${formatPrecio(product.precio)}`);
    }
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
}
