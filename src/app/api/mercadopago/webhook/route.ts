import { NextRequest, NextResponse } from "next/server";
import { getPaymentClient } from "@/lib/mercadopago";
import { applyPaymentStatusFromPayment } from "@/lib/orders";

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
    console.error("Error procesando webhook de MercadoPago:", error);
    return NextResponse.json({ received: true });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
