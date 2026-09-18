import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { prisma } from "@/lib/prisma";
import { applyPaymentStatus } from "@/lib/orders";
import { formatPrecio } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string; payment_id?: string };
}) {
  const { orderId, payment_id } = searchParams;

  if (orderId && payment_id) {
    // El webhook suele llegar antes, pero por si todavía no procesó la
    // notificación, sincronizamos el estado acá también (es idempotente).
    await applyPaymentStatus(orderId, payment_id).catch(() => null);
  }

  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId } })
    : null;

  return (
    <>
      <Header />
      <main className="flex-1 container-melera flex flex-col items-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
          ✓
        </div>
        <h1 className="mt-6 font-serif text-3xl font-semibold text-marron sm:text-4xl">
          ¡Gracias por tu compra!
        </h1>
        <p className="mt-3 max-w-md text-stone-600">
          Tu pago fue confirmado. En breve nos ponemos en contacto para
          coordinar el envío.
        </p>

        {order && (
          <div className="mt-8 w-full max-w-sm rounded-2xl border border-miel-100 bg-white p-6 text-left shadow-soft">
            <p className="text-sm text-stone-500">Pedido</p>
            <p className="font-semibold text-marron">#{order.numero}</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-stone-500">Total</span>
              <span className="font-semibold text-marron">
                {formatPrecio(order.total)}
              </span>
            </div>
          </div>
        )}

        <Link href="/" className="btn-primary mt-8">
          Volver al inicio
        </Link>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
