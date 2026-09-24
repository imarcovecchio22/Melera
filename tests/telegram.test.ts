import { describe, expect, it } from "vitest";
import { parseBotToken } from "@/lib/telegram";

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
