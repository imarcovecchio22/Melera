import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import QuienesSomos from "@/components/QuienesSomos";
import ProductoSection from "@/components/ProductoSection";
import Testimonios from "@/components/Testimonios";
import { getMainProduct } from "@/lib/product";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const product = await getMainProduct();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <QuienesSomos />
        <ProductoSection product={product} />
        <Testimonios />
      </main>
      <Footer />
    </>
  );
}
