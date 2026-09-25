import { formatPrecio } from "@/lib/utils";

/**
 * Precio por escalón (promos por cantidad): desde cierta cantidad de frascos, cada frasco
 * sale más barato. Ej.: [{ desde: 5, precio: 6000 }, { desde: 10, precio: 5500 }].
 * Sin dependencias de servidor: lo usan el checkout (el total SIEMPRE se calcula en el
 * servidor) y las páginas para mostrar el ahorro.
 */
export type Escalon = { desde: number; precio: number };

/** Lee los escalones guardados en la base sin confiar en su forma; los ordena por cantidad. */
export function leerEscalones(valor: unknown): Escalon[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter(
      (e): e is Escalon =>
        typeof e === "object" &&
        e !== null &&
        Number.isInteger(e.desde) &&
        e.desde >= 2 &&
        Number.isInteger(e.precio) &&
        e.precio > 0
    )
    .map((e) => ({ desde: e.desde, precio: e.precio }))
    .sort((a, b) => a.desde - b.desde);
}

/** Precio de cada frasco para esa cantidad: el del escalón más alto alcanzado (nunca más caro que el base). */
export function precioUnitario(precioBase: number, escalones: Escalon[], cantidad: number) {
  let precio = precioBase;
  for (const e of escalones) if (cantidad >= e.desde && e.precio < precio) precio = e.precio;
  return precio;
}

export function totalPedido(precioBase: number, escalones: Escalon[], cantidad: number) {
  const unitario = precioUnitario(precioBase, escalones, cantidad);
  return { unitario, total: unitario * cantidad, ahorro: (precioBase - unitario) * cantidad };
}

/** "5 frascos a $30.000 · 10 frascos a $55.000" (para textos, el chat y las respuestas automáticas). */
export function textoPromos(escalones: Escalon[]) {
  return escalones.map((e) => `${e.desde} frascos a ${formatPrecio(e.desde * e.precio)}`).join(" · ");
}

/**
 * Revisa que los escalones tengan sentido: cantidades distintas (desde 2 frascos) y cada
 * escalón más barato que el precio base y que el escalón anterior. Devuelve el error o null.
 */
export function errorEscalones(precioBase: number, escalones: Escalon[]) {
  let anterior = { desde: 1, precio: precioBase };
  for (const e of [...escalones].sort((a, b) => a.desde - b.desde)) {
    if (!Number.isInteger(e.desde) || e.desde < 2) return "Cada promo tiene que ser desde 2 frascos o más";
    if (e.desde === anterior.desde) return `Hay dos promos desde ${e.desde} frascos`;
    if (!Number.isInteger(e.precio) || e.precio <= 0) return "El precio de cada promo tiene que ser mayor a 0";
    if (e.precio >= anterior.precio)
      return `La promo desde ${e.desde} frascos tiene que ser más barata que ${formatPrecio(anterior.precio)} por frasco`;
    anterior = e;
  }
  return null;
}
