import Link from "next/link";
import HoneyJarIllustration from "./HoneyJarIllustration";
import { formatPrecio } from "@/lib/utils";
import type { Product } from "@prisma/client";

export default function ProductoSection({ product }: { product: Product }) {
  const sinStock = product.stock <= 0;

  return (
    <section id="producto" className="bg-miel-50 py-16 sm:py-24">
      <div className="container-melera grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex justify-center rounded-3xl bg-white p-10 shadow-soft">
          <HoneyJarIllustration className="w-56 sm:w-72" />
        </div>
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-miel-600">
            Nuestro producto
          </span>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-stone-800 sm:text-4xl">
            {product.nombre}
          </h2>
          <p className="mt-4 text-stone-600">{product.descripcion}</p>
          <p className="mt-6 font-serif text-4xl font-semibold text-miel-700">
            {formatPrecio(product.precio)}
          </p>
          {sinStock ? (
            <p className="mt-6 inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
              Sin stock por el momento
            </p>
          ) : (
            <Link href="/producto" className="btn-primary mt-6">
              Comprar ahora
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
