import { describe, expect, it } from "vitest";
import { esUrlPublicaHttps, safeEqual } from "@/lib/security";

describe("safeEqual", () => {
  it("compara strings", () => {
    expect(safeEqual("secreto", "secreto")).toBe(true);
    expect(safeEqual("secreto", "secretO")).toBe(false);
    expect(safeEqual("corto", "mucho-mas-largo")).toBe(false);
  });

  it("rechaza valores que no son strings", () => {
    expect(safeEqual(undefined, undefined)).toBe(false);
    expect(safeEqual(null, "x")).toBe(false);
    expect(safeEqual(["a"], "a")).toBe(false);
  });
});

describe("esUrlPublicaHttps", () => {
  it.each([
    "https://melera.vercel.app/producto-miel.png",
    "https://images.unsplash.com/photo.jpg?w=1200&q=80",
  ])("acepta %s", (url) => {
    expect(esUrlPublicaHttps(url)).toBe(true);
  });

  it.each([
    "http://melera.vercel.app/x.png",
    "https://localhost/x.png",
    "https://127.0.0.1/x.png",
    "https://10.0.0.5/x.png",
    "https://192.168.1.1/x.png",
    "https://172.20.0.1/x.png",
    "https://169.254.169.254/latest/meta-data",
    "https://[::1]/x",
    "https://user:pass@host.com/x.png",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "no es una url",
  ])("rechaza %s", (url) => {
    expect(esUrlPublicaHttps(url)).toBe(false);
  });
});
