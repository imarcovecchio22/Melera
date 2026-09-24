import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({ findUniqueOrThrow: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { product: db } }));
const logs = vi.hoisted(() => ({ logEvent: vi.fn(async (tipo: string, mensaje: string) => void [tipo, mensaje]) }));
vi.mock("@/lib/logs", () => logs);

import { PATCH } from "@/app/api/admin/stock/route";

const pedido = (body: unknown) =>
  new NextRequest("https://melera.vercel.app/api/admin/stock", { method: "PATCH", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  db.findUniqueOrThrow.mockResolvedValue({ id: "p1", nombre: "Miel", precio: 6500, stock: 10 });
  db.update.mockImplementation(async ({ data }) => ({ id: "p1", nombre: "Miel", precio: 6500, stock: 10, ...data }));
});

describe("/api/admin/stock", () => {
  it("guarda precio y stock y registra solo lo que cambió", async () => {
    const res = await PATCH(pedido({ productId: "p1", stock: 10, precio: 7200 }));
    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { stock: 10, precio: 7200 } });
    expect(logs.logEvent).toHaveBeenCalledTimes(1);
    expect(logs.logEvent.mock.calls[0][1]).toMatch(/Precio de Miel cambiado de .*6\.500 a .*7\.200/);
  });

  it("sin precio solo cambia el stock (compatible con pedidos viejos)", async () => {
    await PATCH(pedido({ productId: "p1", stock: 3 }));
    expect(db.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { stock: 3 } });
  });

  it("rechaza precios inválidos con un mensaje claro", async () => {
    for (const precio of [0, -5, 12.5, "abc"]) {
      const res = await PATCH(pedido({ productId: "p1", stock: 1, precio }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBeTruthy();
    }
    expect(db.update).not.toHaveBeenCalled();
  });
});
