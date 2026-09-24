import ChatWidget from "@/components/ChatWidget";
import FotoFrasco from "@/components/FotoFrasco";
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
      <main className="contenedor-panal flex-1 pb-16 pt-2 sm:pb-24">
        <div className="mx-auto grid max-w-[1100px] items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          {/* La foto es la protagonista (y el LCP de la página) */}
          <FotoFrasco
            priority
            sizes="(min-width: 1024px) 480px, 260px"
            imgClassName="h-[42svh] w-auto lg:h-[min(72svh,640px)]"
          />
          <div className="velo-texto">
            <h1 className="titulo-panal">{product.nombre}</h1>
            <p className="texto-suave mt-4 leading-[1.65]">{product.descripcion}</p>
            <p className="mt-6 flex items-baseline gap-2.5">
              <span className="precio-panal text-[2.5rem]">{formatPrecio(product.precio)}</span>
              <span className="texto-suave">el frasco de 500 g</span>
            </p>
            <div className="mt-8">
              <QuantitySelector stock={product.stock} origen={origen} />
            </div>
          </div>
        </div>
      </main>
      <ChatWidget />
    </>
  );
}
