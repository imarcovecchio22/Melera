import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import Image from "next/image";
import QuantitySelector from "@/components/QuantitySelector";
import { getMainProduct } from "@/lib/product";
import { formatPrecio } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductoPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ origen?: string | string[] }>;
}) {
  const searchParams = await searchParamsPromise;
  const product = await getMainProduct();
  const origen = Array.isArray(searchParams.origen) ? searchParams.origen[0] : searchParams.origen;

  return (
    <>
      <Header />
      <main className="flex-1 container-melera py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex justify-center rounded-3xl bg-miel-50 p-10">
            <Image
              src="/producto-miel.png"
              alt="Frasco de miel artesanal Melera"
              width={433}
              height={577}
              priority
              className="h-auto w-64 sm:w-80"
            />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold text-marron sm:text-4xl">
              {product.nombre}
            </h1>
            <p className="mt-4 leading-relaxed text-stone-600">
              {product.descripcion}
            </p>
            <p className="mt-6 font-serif text-4xl font-semibold text-miel-700">
              {formatPrecio(product.precio)}
            </p>
            <div className="mt-8">
              <QuantitySelector stock={product.stock} origen={origen} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
