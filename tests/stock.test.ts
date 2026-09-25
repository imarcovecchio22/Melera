import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { product: db } }));
const logs = vi.hoisted(() => ({ logEvent: vi.fn(async (tipo: string, mensaje: string) => void [tipo, mensaje]) }));
vi.mock("@/lib/logs", () => logs);

import { PATCH } from "@/app/api/admin/stock/route";

const pedido = (body: unknown) =>
  new NextRequest("https://melera.vercel.app/api/admin/stock", { method: "PATCH", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  db.findUnique.mockResolvedValue({ id: "p1", nombre: "Miel", precio: 6500, stock: 10, escalones: [] });
  db.update.mockImplementation(async ({ data }) => ({ id: "p1", nombre: "Miel", precio: 6500, stock: 10, escalones: [], ...data }));
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

  it("guarda las promos por cantidad ordenadas y las registra", async () => {
    const res = await PATCH(pedido({ productId: "p1", stock: 10, escalones: [{ desde: 10, precio: 5500 }, { desde: 5, precio: 6000 }] }));
    expect(res.status).toBe(200);
    expect(db.update.mock.calls[0][0].data.escalones).toEqual([{ desde: 5, precio: 6000 }, { desde: 10, precio: 5500 }]);
    expect(logs.logEvent.mock.calls.some((c) => /Promos de Miel: 5 frascos a .*30\.000 · 10 frascos a .*55\.000/.test(c[1]))).toBe(true);
  });

  it("rechaza promos que no bajan el precio o repiten cantidad", async () => {
    for (const escalones of [
      [{ desde: 5, precio: 7000 }], // más cara que el precio base
      [{ desde: 5, precio: 6000 }, { desde: 10, precio: 6200 }], // la de 10 más cara que la de 5
      [{ desde: 5, precio: 6000 }, { desde: 5, precio: 5500 }], // cantidad repetida
      [{ desde: 1, precio: 6000 }], // desde 1 frasco no es promo
    ]) {
      const res = await PATCH(pedido({ productId: "p1", stock: 10, escalones }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBeTruthy();
    }
    expect(db.update).not.toHaveBeenCalled();
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
