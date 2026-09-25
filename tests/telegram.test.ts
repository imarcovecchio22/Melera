import { afterEach, describe, expect, it } from "vitest";
import { parseBotToken, siteUrl } from "@/lib/telegram";

const TOKEN = "1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw";

describe("parseBotToken", () => {
  it.each([
    [TOKEN],
    [`bot${TOKEN}`],
    [`"${TOKEN}"`],
    [`  ${TOKEN}\n`],
    [`Use this token to access the HTTP API:\n${TOKEN}\nKeep your token secure`],
  ])("encuentra el token en %j", (valor) => {
    expect(parseBotToken(valor)).toBe(TOKEN);
  });

  it("devuelve undefined si no hay token", () => {
    expect(parseBotToken("melera_bot")).toBeUndefined();
    expect(parseBotToken(undefined)).toBeUndefined();
  });
});

describe("siteUrl", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it.each([
    [undefined, "https://melera.vercel.app"],
    ["", "https://melera.vercel.app"],
    ["   ", "https://melera.vercel.app"],
    ["melera.vercel.app", "https://melera.vercel.app"], // sin protocolo: no sirve
    ["https://melera.vercel.app/", "https://melera.vercel.app"],
    ["http://localhost:3000", "http://localhost:3000"],
  ])("NEXT_PUBLIC_BASE_URL=%j -> %s", (valor, esperado) => {
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (valor === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_BASE_URL = valor;
    expect(siteUrl()).toBe(esperado);
  });

  it("usa el dominio de producción de Vercel si no hay NEXT_PUBLIC_BASE_URL", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "melera.vercel.app";
    expect(siteUrl()).toBe("https://melera.vercel.app");
  });
});

describe("sendTelegramPhoto", () => {
  const original = { ...process.env };
  const fetchOriginal = globalThis.fetch;
  afterEach(() => {
    process.env = { ...original };
    globalThis.fetch = fetchOriginal;
  });

  function capturar() {
    const llamadas: { url: string; init: RequestInit }[] = [];
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      llamadas.push({ url, init });
      return new Response(JSON.stringify({ ok: true, result: { message_id: 77 } }), { status: 200 });
    }) as typeof fetch;
    process.env.TELEGRAM_BOT_TOKEN = TOKEN;
    process.env.TELEGRAM_CHAT_ID = "6219737981";
    return llamadas;
  }

  it("con los bytes de la imagen la sube como archivo (Telegram no tiene que entrar al sitio)", async () => {
    const { sendTelegramPhoto } = await import("@/lib/telegram");
    const llamadas = capturar();
    const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const id = await sendTelegramPhoto({
      photo: jpg,
      nombreArchivo: "post-6-feed.jpg",
      caption: "dato (panal) · post #6",
      botones: [[{ text: "Feed", callback_data: "ig:feed:6" }]],
    });
    expect(id).toBe(77);
    const { url, init } = llamadas[0];
    expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/sendPhoto`);
    expect(init.headers).toBeUndefined(); // el Content-Type multipart lo arma fetch
    const form = init.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("chat_id")).toBe("6219737981");
    expect(form.get("caption")).toBe("dato (panal) · post #6");
    expect(JSON.parse(String(form.get("reply_markup")))).toEqual({ inline_keyboard: [[{ text: "Feed", callback_data: "ig:feed:6" }]] });
    const archivo = form.get("photo") as File;
    expect(archivo.name).toBe("post-6-feed.jpg");
    expect(archivo.type).toBe("image/jpeg");
    expect(new Uint8Array(await archivo.arrayBuffer())).toEqual(jpg);
  });

  it("con una URL sigue mandando JSON como antes", async () => {
    const { sendTelegramPhoto } = await import("@/lib/telegram");
    const llamadas = capturar();
    await sendTelegramPhoto({ photo: "https://melera.vercel.app/api/img/feed/x.jpg", caption: "hola", silencioso: true });
    const body = JSON.parse(String(llamadas[0].init.body));
    expect(body).toMatchObject({ photo: "https://melera.vercel.app/api/img/feed/x.jpg", caption: "hola", disable_notification: true, chat_id: "6219737981" });
  });

  it("corta el caption en el límite de Telegram (1024)", async () => {
    const { sendTelegramPhoto } = await import("@/lib/telegram");
    const llamadas = capturar();
    await sendTelegramPhoto({ photo: new Uint8Array([1]), caption: "x".repeat(2000) });
    expect(String((llamadas[0].init.body as FormData).get("caption"))).toHaveLength(1024);
  });
});
