import { prisma } from "@/lib/prisma";
import { getPaymentClient } from "@/lib/mercadopago";
import type { OrderStatus, Product } from "@prisma/client";

export function mapMpStatus(status: string): OrderStatus | null {
  switch (status) {
    case "approved":
      return "pagado";
    case "pending":
    case "in_process":
    case "authorized":
      return "pendiente";
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelado";
    default:
      return null;
  }
}

/**
 * Aplica el estado de un pago de MercadoPago a un pedido. Idempotente:
 * si el pedido ya está pagado, una notificación posterior no lo revierte,
 * y el stock solo se descuenta una vez (en la transición a "pagado").
 */
export async function applyPaymentStatus(orderId: string, paymentId: string) {
  const payment = await getPaymentClient().get({ id: paymentId });
  return applyPayment(orderId, payment);
}

/**
 * Igual que applyPaymentStatus, pero recibe el pago ya obtenido de MercadoPago
 * (evita una segunda llamada a la API cuando ya se hizo el fetch antes).
 */
export async function applyPaymentStatusFromPayment(
  payment: Awaited<ReturnType<ReturnType<typeof getPaymentClient>["get"]>>
) {
  const orderId = payment.external_reference;
  if (!orderId) return null;
  return applyPayment(orderId, payment);
}

async function applyPayment(
  orderId: string,
  payment: { status?: string | null; id?: number | string | null }
) {
  const nuevoEstado = payment.status ? mapMpStatus(payment.status) : null;
  if (!nuevoEstado) return null;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  if (order.estado === "pagado" && nuevoEstado !== "pagado") {
    return order;
  }

  const pasaAPagado = nuevoEstado === "pagado" && order.estado !== "pagado";

  const { updated, product } = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        estado: nuevoEstado,
        mpPaymentId: String(payment.id),
      },
    });

    let product: Product | null = null;
    if (pasaAPagado) {
      product = await tx.product.update({
        where: { id: order.productId },
        data: { stock: { decrement: order.cantidad } },
      });
    }

    return { updated, product };
  });

  if (pasaAPagado && product) {
    notifyOrderPaid(updated, product).catch((error) => {
      console.error("Error notificando pedido pagado a Make:", error);
    });
  }

  return updated;
}

/**
 * Avisa a Make.com (que reenvía por Telegram) que un pedido se pagó.
 * Best-effort: nunca debe afectar la confirmación del pago si falla o
 * si la variable de entorno no está configurada.
 */
async function notifyOrderPaid(
  order: { numero: number; nombre: string; apellido: string; cantidad: number; total: number },
  product: { nombre: string; stock: number }
) {
  const webhookUrl = process.env.MAKE_ORDER_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      numero: order.numero,
      nombre: order.nombre,
      apellido: order.apellido,
      producto: product.nombre,
      cantidad: order.cantidad,
      total: order.total,
      stockRestante: product.stock,
    }),
  });
}
