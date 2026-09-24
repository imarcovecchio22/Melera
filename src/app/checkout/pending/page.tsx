import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { applyPaymentStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function CheckoutPendingPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ orderId?: string; payment_id?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  const { orderId, payment_id } = searchParams;

  if (orderId && payment_id) {
    await applyPaymentStatus(orderId, payment_id).catch(() => null);
  }

  return (
    <>
      <Header />
      <main className="flex-1 container-melera flex flex-col items-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600">
          ⏳
        </div>
        <h1 className="mt-6 font-serif text-3xl font-semibold text-marron sm:text-4xl">
          Tu pago está pendiente
        </h1>
        <p className="mt-3 max-w-md text-stone-600">
          Estamos esperando la confirmación de MercadoPago. Te avisaremos por
          email en cuanto se acredite el pago.
        </p>
        <Link href="/" className="btn-primary mt-8">
          Volver al inicio
        </Link>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
