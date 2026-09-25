import ChatWidget from "@/components/ChatWidget";
import Hero from "@/components/Hero";
import QuienesSomos from "@/components/QuienesSomos";
import ProductoSection from "@/components/ProductoSection";
import { getMainProduct } from "@/lib/product";
import { leerEscalones } from "@/lib/precios";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const product = await getMainProduct();

  return (
    <>
      <main className="flex-1">
        <Hero precio={product.precio} escalones={leerEscalones(product.escalones)} />
        <QuienesSomos />
        <ProductoSection product={product} />
      </main>
      <ChatWidget />
    </>
  );
}
