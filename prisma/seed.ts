import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.product.findFirst();
  if (existing) {
    console.log("Ya existe un producto, no se crea uno nuevo:", existing.id);
    return;
  }

  const product = await prisma.product.create({
    data: {
      nombre: "Miel Artesanal 500g",
      descripcion:
        "Miel pura de abejas, producida por Apícola Mercedes (Tomás Jofré, Buenos Aires). Envasada en frasco de vidrio de 500g.",
      precio: 6000,
      stock: 50,
    },
  });

  console.log("Producto creado:", product);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
