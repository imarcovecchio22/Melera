import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import CheckoutForm from "@/components/CheckoutForm";
import { getMainProduct } from "@/lib/product";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { cantidad?: string };
}) {
  const product = await getMainProduct();
  const cantidadInicial = Math.max(
    1,
    Math.min(product.stock || 1, Number(searchParams.cantidad) || 1)
  );

  return (
    <>
      <Header />
      <main className="flex-1 container-melera py-12 sm:py-16">
        <h1 className="mb-8 font-serif text-3xl font-semibold text-marron sm:text-4xl">
          Finalizar compra
        </h1>
        <CheckoutForm
          producto={{ nombre: product.nombre, precio: product.precio }}
          cantidadInicial={cantidadInicial}
        />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
