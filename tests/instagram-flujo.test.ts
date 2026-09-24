import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// --- mocks de base de datos, Telegram, Meta y logs ---
const db = vi.hoisted(() => ({
  updateMany: vi.fn(),
  update: vi.fn(),
  findUniqueOrThrow: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { postIG: db } }));

const tg = vi.hoisted(() => ({
  answerTelegramCallback: vi.fn(async () => {}),
  editTelegramCaption: vi.fn(async () => {}),
  sendTelegramMessage: vi.fn(async () => true),
  telegramChatId: vi.fn(() => "6219737981"),
}));
vi.mock("@/lib/telegram", () => tg);

const meta = vi.hoisted(() => ({
  publicarEnInstagram: vi.fn(),
  modoPrueba: vi.fn(() => false),
}));
vi.mock("@/lib/instagram/meta", () => meta);

vi.mock("@/lib/logs", () => ({
  logEvent: vi.fn(async () => {}),
  errorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

const pendientes: Promise<unknown>[] = [];
vi.mock("@vercel/functions", () => ({ waitUntil: (p: Promise<unknown>) => pendientes.push(p) }));

import { procesarBoton } from "@/lib/instagram/aprobar";
import { POST as webhook } from "@/app/api/telegram/webhook/route";

const POST_GENERADO = {
  id: 12,
  feedUrl: "https://melera.vercel.app/api/img/feed/x.jpg",
  storyUrl: "https://melera.vercel.app/api/img/story/x.jpg",
  caption: "Caption del post",
};

beforeEach(() => {
  vi.clearAllMocks();
  pendientes.length = 0;
  process.env.TELEGRAM_WEBHOOK_SECRET = "secreto-del-webhook-123";
  db.findUniqueOrThrow.mockResolvedValue(POST_GENERADO);
  db.update.mockResolvedValue({});
});

describe("procesarBoton", () => {
  it("si otro toque ya tomó el post, no publica nada", async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    await procesarBoton("both", 12, 55);
    expect(meta.publicarEnInstagram).not.toHaveBeenCalled();
    expect(tg.editTelegramCaption).not.toHaveBeenCalled();
  });

  it("Feed publica solo en el feed, con caption", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });
    meta.publicarEnInstagram.mockResolvedValue("media-1");
    await procesarBoton("feed", 12, 55);
    expect(meta.publicarEnInstagram).toHaveBeenCalledTimes(1);
    expect(meta.publicarEnInstagram).toHaveBeenCalledWith({
      tipo: "feed",
      imageUrl: POST_GENERADO.feedUrl,
      caption: "Caption del post",
    });
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: "publicado", feedMediaId: "media-1", storyMediaId: null }) })
    );
    expect(tg.editTelegramCaption).toHaveBeenCalledWith(55, expect.stringContaining("✅ Publicado en feed"));
  });

  it("Historia publica solo la historia", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });
    meta.publicarEnInstagram.mockResolvedValue("media-2");
    await procesarBoton("story", 12, 55);
    expect(meta.publicarEnInstagram).toHaveBeenCalledTimes(1);
    expect(meta.publicarEnInstagram).toHaveBeenCalledWith({ tipo: "story", imageUrl: POST_GENERADO.storyUrl });
  });

  it("si falla solo la historia, queda publicado y avisa", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });
    meta.publicarEnInstagram
      .mockResolvedValueOnce("media-feed")
      .mockRejectedValueOnce(new Error("Meta respondió 400 (código 200): Cannot call API"));
    await procesarBoton("both", 12, 55);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: "publicado", feedMediaId: "media-feed" }) })
    );
    expect(tg.sendTelegramMessage).toHaveBeenCalledWith(expect.stringContaining("Cannot call API"));
  });

  it("si no sale nada, vuelve a esperar aprobación para reintentar", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });
    meta.publicarEnInstagram.mockRejectedValue(new Error("Meta caída"));
    await procesarBoton("both", 12, 55);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: "esperando_aprobacion", destino: null }) })
    );
    expect(tg.editTelegramCaption).not.toHaveBeenCalled(); // los botones siguen ahí
    expect(tg.sendTelegramMessage).toHaveBeenCalled();
  });

  it("Descartar no publica y marca descartado", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });
    await procesarBoton("descartar", 12, 55);
    expect(meta.publicarEnInstagram).not.toHaveBeenCalled();
    expect(db.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { estado: "descartado" } }));
    expect(tg.editTelegramCaption).toHaveBeenCalledWith(55, "❌ Descartado");
  });
});

function pedidoWebhook(body: unknown, secreto?: string) {
  return new NextRequest("https://melera.vercel.app/api/telegram/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secreto ? { "x-telegram-bot-api-secret-token": secreto } : {}),
    },
    body: JSON.stringify(body),
  });
}

const callback = (data: string, chatId = 6219737981) => ({
  callback_query: { id: "cb1", data, from: { id: chatId }, message: { message_id: 55, chat: { id: chatId } } },
});

describe("webhook de Telegram", () => {
  it("rechaza pedidos sin la clave secreta o con una incorrecta", async () => {
    expect((await webhook(pedidoWebhook(callback("ig:feed:12")))).status).toBe(401);
    expect((await webhook(pedidoWebhook(callback("ig:feed:12"), "otra-clave"))).status).toBe(401);
    expect(db.updateMany).not.toHaveBeenCalled();
  });

  it("ignora botones de otro chat", async () => {
    const res = await webhook(pedidoWebhook(callback("ig:feed:12", 111), "secreto-del-webhook-123"));
    expect(res.status).toBe(200);
    expect(pendientes).toHaveLength(0);
    expect(tg.answerTelegramCallback).not.toHaveBeenCalled();
  });

  it("contesta los botones viejos sin procesarlos", async () => {
    const res = await webhook(pedidoWebhook(callback("pub_feed_24"), "secreto-del-webhook-123"));
    expect(res.status).toBe(200);
    expect(pendientes).toHaveLength(0);
    expect(tg.answerTelegramCallback).toHaveBeenCalledWith("cb1", expect.stringContaining("sistema anterior"));
  });

  it("procesa un botón válido en segundo plano", async () => {
    db.updateMany.mockResolvedValue({ count: 1 });
    meta.publicarEnInstagram.mockResolvedValue("media-1");
    const res = await webhook(pedidoWebhook(callback("ig:feed:12"), "secreto-del-webhook-123"));
    expect(res.status).toBe(200);
    expect(tg.answerTelegramCallback).toHaveBeenCalledWith("cb1", "Procesando…");
    expect(pendientes).toHaveLength(1);
    await Promise.all(pendientes);
    expect(meta.publicarEnInstagram).toHaveBeenCalledWith(expect.objectContaining({ tipo: "feed" }));
  });

  it("ignora updates que no son botones", async () => {
    const res = await webhook(pedidoWebhook({ message: { text: "hola" } }, "secreto-del-webhook-123"));
    expect(res.status).toBe(200);
    expect(pendientes).toHaveLength(0);
  });
});
