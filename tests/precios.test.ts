import { describe, expect, it } from "vitest";
import { errorEscalones, leerEscalones, precioUnitario, textoPromos, totalPedido } from "@/lib/precios";

const ESC = [{ desde: 5, precio: 6000 }, { desde: 10, precio: 5500 }];

describe("precio por escalón", () => {
  it.each([
    [1, 6500, 6500],
    [4, 6500, 26000],
    [5, 6000, 30000],
    [7, 6000, 42000],
    [9, 6000, 54000],
    [10, 5500, 55000],
    [12, 5500, 66000],
  ])("%i frascos: %i c/u, total %i", (cantidad, unitario, total) => {
    expect(totalPedido(6500, ESC, cantidad)).toMatchObject({ unitario, total });
  });

  it("calcula el ahorro contra el precio base", () => {
    expect(totalPedido(6500, ESC, 5).ahorro).toBe(2500);
    expect(totalPedido(6500, ESC, 10).ahorro).toBe(10000);
    expect(totalPedido(6500, ESC, 1).ahorro).toBe(0);
  });

  it("sin promos, o con una promo más cara que el precio base, cobra el precio base", () => {
    expect(precioUnitario(6500, [], 20)).toBe(6500);
    expect(precioUnitario(6500, [{ desde: 5, precio: 7000 }], 5)).toBe(6500);
  });

  it("el orden en que vienen los escalones no importa", () => {
    expect(precioUnitario(6500, leerEscalones([ESC[1], ESC[0]]), 10)).toBe(5500);
  });
});

describe("leerEscalones", () => {
  it("descarta lo que no tiene forma de escalón y ordena", () => {
    expect(leerEscalones([{ desde: 10, precio: 5500 }, { desde: 1, precio: 1 }, { desde: "5" }, null, { desde: 5, precio: 6000 }])).toEqual(ESC);
    expect(leerEscalones("no")).toEqual([]);
  });
});

describe("textoPromos", () => {
  it("arma el texto con el total de cada pack", () => {
    expect(textoPromos(ESC)).toMatch(/^5 frascos a \$\s?30\.000 · 10 frascos a \$\s?55\.000$/);
    expect(textoPromos([])).toBe("");
  });
});

describe("errorEscalones", () => {
  it("acepta promos que bajan el precio a medida que sube la cantidad", () => {
    expect(errorEscalones(6500, ESC)).toBeNull();
    expect(errorEscalones(6500, [])).toBeNull();
  });

  it.each([
    [[{ desde: 5, precio: 6500 }], /más barata/],
    [[{ desde: 5, precio: 6000 }, { desde: 10, precio: 6000 }], /más barata/],
    [[{ desde: 5, precio: 6000 }, { desde: 5, precio: 5000 }], /dos promos/],
    [[{ desde: 1, precio: 6000 }], /desde 2/],
  ])("rechaza %j", (escalones, error) => {
    expect(errorEscalones(6500, escalones)).toMatch(error);
  });
});
