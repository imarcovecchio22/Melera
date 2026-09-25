import { NextRequest, NextResponse } from "next/server";
import { getPaymentClient } from "@/lib/mercadopago";
import { applyPaymentStatusFromPayment } from "@/lib/orders";
import { errorMessage, logEvent } from "@/lib/logs";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") ?? url.searchParams.get("type");
  let paymentId = url.searchParams.get("id") ?? url.searchParams.get("data.id");

  if (!paymentId) {
    const body = await req.json().catch(() => null);
    paymentId = body?.data?.id ?? null;
  }

  if (topic !== "payment" || !paymentId) {
    return NextResponse.json({ received: true });
  }

  try {
    const payment = await getPaymentClient().get({ id: paymentId });
    await applyPaymentStatusFromPayment(payment);
    return NextResponse.json({ received: true });
  } catch (error) {
    await logEvent("pago", `Error procesando el aviso de Mercado Pago del pago ${paymentId}`, {
      nivel: "error",
      detalle: { error: errorMessage(error) },
    });
    // 500 para que Mercado Pago reintente: con un 200 el pago quedaría sin registrar para siempre
    // (aplicar el pago es idempotente, así que un reintento no duplica nada).
    return NextResponse.json({ received: false }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
