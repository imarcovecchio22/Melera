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
