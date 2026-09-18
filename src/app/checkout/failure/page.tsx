import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { applyPaymentStatus } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: { orderId?: string; payment_id?: string };
}) {
  const { orderId, payment_id } = searchParams;

  if (orderId && payment_id) {
    await applyPaymentStatus(orderId, payment_id).catch(() => null);
  }

  return (
    <>
      <Header />
      <main className="flex-1 container-melera flex flex-col items-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
          ✕
        </div>
        <h1 className="mt-6 font-serif text-3xl font-semibold text-marron sm:text-4xl">
          El pago no se pudo completar
        </h1>
        <p className="mt-3 max-w-md text-stone-600">
          Algo falló durante el pago. Podés intentar de nuevo o contactarnos
          por WhatsApp si el problema persiste.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/producto" className="btn-primary">
            Intentar de nuevo
          </Link>
          <Link href="/" className="btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
