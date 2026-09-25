import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";

// --- mocks de lo que usan los crons y el webhook de Mercado Pago ---
const ig = vi.hoisted(() => ({
  generarPendientes: vi.fn(async () => ({ generados: 0, errores: 0 })),
  estadoToken: vi.fn(async () => ({ valido: true, diasRestantes: 50, expiraEn: null })),
  renovarTokenSiHaceFalta: vi.fn(async () => ({ renovado: false, expiresAt: null, dias: 40 })),
}));
vi.mock("@/lib/instagram/generar", () => ({ generarPendientes: ig.generarPendientes }));
vi.mock("@/lib/instagram/meta", () => ({ estadoToken: ig.estadoToken }));
vi.mock("@/lib/instagram/token", () => ({ renovarTokenSiHaceFalta: ig.renovarTokenSiHaceFalta }));
vi.mock("@/lib/telegram", () => ({ sendTelegramMessage: vi.fn(async () => true) }));
vi.mock("@/lib/logs", () => ({
  logEvent: vi.fn(async () => {}),
  errorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

const mp = vi.hoisted(() => ({ get: vi.fn(), aplicar: vi.fn(async () => null) }));
vi.mock("@/lib/mercadopago", () => ({ getPaymentClient: () => ({ get: mp.get }) }));
vi.mock("@/lib/orders", () => ({ applyPaymentStatusFromPayment: mp.aplicar }));

import { proxy } from "@/proxy";
import { GET as cronInstagram } from "@/app/api/cron/instagram/route";
import { GET as cronToken } from "@/app/api/cron/instagram-token/route";
import { POST as webhookMP } from "@/app/api/mercadopago/webhook/route";

const SECRETO = "secreto-de-sesion-de-prueba";
const sesion = (secreto = SECRETO) =>
  new SignJWT({ username: "admin" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(secreto));

const pedido = (ruta: string, opciones: { method?: string; cookie?: string; origin?: string; auth?: string } = {}) => {
  const headers: Record<string, string> = {};
  if (opciones.cookie) headers.cookie = `melera_admin_session=${opciones.cookie}`;
  if (opciones.origin) headers.origin = opciones.origin;
  if (opciones.auth) headers.authorization = opciones.auth;
  return new NextRequest(`https://melera.vercel.app${ruta}`, { method: opciones.method ?? "GET", headers });
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXTAUTH_SECRET = SECRETO;
  process.env.CRON_SECRET = "clave-del-cron";
  process.env.IG_ACCESS_TOKEN = "token";
});

describe("proxy del admin", () => {
  it("sin sesión: las páginas redirigen al login y la API responde 401", async () => {
    const pagina = await proxy(pedido("/admin/pedidos"));
    expect(pagina.status).toBe(307);
    expect(pagina.headers.get("location")).toBe("https://melera.vercel.app/admin/login?from=%2Fadmin%2Fpedidos");
    expect((await proxy(pedido("/api/admin/stock", { method: "PATCH" }))).status).toBe(401);
  });

  it("con una sesión válida deja pasar", async () => {
    const token = await sesion();
    expect((await proxy(pedido("/admin/pedidos", { cookie: token }))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(pedido("/api/admin/stock", { method: "PATCH", cookie: token, origin: "https://melera.vercel.app" }))).headers.get("x-middleware-next")).toBe("1");
  });

  it("rechaza sesiones firmadas con otra clave o sin NEXTAUTH_SECRET", async () => {
    expect((await proxy(pedido("/api/admin/stock", { cookie: await sesion("otra-clave") }))).status).toBe(401);
    const token = await sesion();
    delete process.env.NEXTAUTH_SECRET;
    expect((await proxy(pedido("/api/admin/stock", { cookie: token }))).status).toBe(401);
  });

  it("CSRF: un cambio en /api/admin desde otro sitio se rechaza aunque haya sesión", async () => {
    const token = await sesion();
    const res = await proxy(pedido("/api/admin/stock", { method: "PATCH", cookie: token, origin: "https://sitio-malo.com" }));
    expect(res.status).toBe(403);
    // Leer (GET) desde otro origen no cambia nada: no se bloquea por origen
    expect((await proxy(pedido("/api/admin/telegram", { cookie: token, origin: "https://sitio-malo.com" }))).status).not.toBe(403);
  });

  it("el login siempre es accesible (si no, no se podría entrar)", async () => {
    expect((await proxy(pedido("/admin/login"))).headers.get("x-middleware-next")).toBe("1");
    expect((await proxy(pedido("/api/admin/login", { method: "POST", origin: "https://melera.vercel.app" }))).headers.get("x-middleware-next")).toBe("1");
  });
});

describe("crons", () => {
  it.each([
    ["sin clave", undefined],
    ["con otra clave", "Bearer otra"],
    ["sin el Bearer", "clave-del-cron"],
  ])("rechazan pedidos %s (401) sin hacer nada", async (_caso, auth) => {
    expect((await cronInstagram(pedido("/api/cron/instagram", { auth }))).status).toBe(401);
    expect((await cronToken(pedido("/api/cron/instagram-token", { auth }))).status).toBe(401);
    expect(ig.generarPendientes).not.toHaveBeenCalled();
    expect(ig.renovarTokenSiHaceFalta).not.toHaveBeenCalled();
  });

  it("si CRON_SECRET no está configurado, no se pueden llamar", async () => {
    delete process.env.CRON_SECRET;
    expect((await cronInstagram(pedido("/api/cron/instagram", { auth: "Bearer undefined" }))).status).toBe(401);
    expect((await cronToken(pedido("/api/cron/instagram-token", { auth: "Bearer " }))).status).toBe(401);
  });

  it("con la clave correcta corren", async () => {
    expect((await cronInstagram(pedido("/api/cron/instagram", { auth: "Bearer clave-del-cron" }))).status).toBe(200);
    expect(ig.generarPendientes).toHaveBeenCalledTimes(1);
    expect((await cronToken(pedido("/api/cron/instagram-token", { auth: "Bearer clave-del-cron" }))).status).toBe(200);
    expect(ig.renovarTokenSiHaceFalta).toHaveBeenCalledTimes(1);
  });
});

describe("webhook de Mercado Pago", () => {
  const aviso = (query: string, body?: unknown) =>
    new NextRequest(`https://melera.vercel.app/api/mercadopago/webhook${query}`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });

  it("consulta el pago en Mercado Pago (no confía en el aviso) y lo aplica", async () => {
    mp.get.mockResolvedValue({ id: 123, status: "approved", external_reference: "ord-1" });
    const res = await webhookMP(aviso("?type=payment", { data: { id: "123" } }));
    expect(res.status).toBe(200);
    expect(mp.get).toHaveBeenCalledWith({ id: "123" });
    expect(mp.aplicar).toHaveBeenCalledWith({ id: 123, status: "approved", external_reference: "ord-1" });
  });

  it("ignora avisos que no son de pagos o no traen id", async () => {
    expect((await webhookMP(aviso("?topic=merchant_order&id=9"))).status).toBe(200);
    expect((await webhookMP(aviso("?type=payment", {}))).status).toBe(200);
    expect(mp.get).not.toHaveBeenCalled();
  });

  it("si falla la consulta a Mercado Pago responde 500 para que reintente (el pago no se pierde)", async () => {
    mp.get.mockRejectedValueOnce(new Error("MP caído"));
    const res = await webhookMP(aviso("?type=payment&data.id=5"));
    expect(res.status).toBe(500);
    expect(mp.aplicar).not.toHaveBeenCalled();
    // el reintento funciona
    mp.get.mockResolvedValueOnce({ id: 5, status: "approved", external_reference: "ord-1" });
    expect((await webhookMP(aviso("?type=payment&data.id=5"))).status).toBe(200);
    expect(mp.aplicar).toHaveBeenCalledTimes(1);
  });
});
