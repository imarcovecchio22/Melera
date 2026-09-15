import { prisma } from "@/lib/prisma";

/**
 * Por ahora la tienda vende un solo producto: devuelve siempre el primero.
 * Si no existe ninguno todavía (DB recién creada), lo crea con valores por defecto.
 */
export async function getMainProduct() {
  let product = await prisma.product.findFirst({ orderBy: { createdAt: "asc" } });

  if (!product) {
    product = await prisma.product.create({
      data: {
        nombre: "Miel Artesanal 500g",
        descripcion:
          "Miel pura de abejas, producida por Apícola Mercedes (Tomás Jofré, Buenos Aires). Envasada en frasco de vidrio de 500g.",
        precio: 6500,
        stock: 50,
      },
    });
  }

  return product;
}
