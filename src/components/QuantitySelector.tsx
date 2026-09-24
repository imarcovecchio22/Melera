"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function QuantitySelector({ stock, origen }: { stock: number; origen?: string }) {
  const [cantidad, setCantidad] = useState(1);
  const router = useRouter();

  const sinStock = stock <= 0;

  function decrementar() {
    setCantidad((c) => Math.max(1, c - 1));
  }

  function incrementar() {
    setCantidad((c) => Math.min(stock, c + 1));
  }

  function comprar() {
    const params = new URLSearchParams({ cantidad: String(cantidad) });
    if (origen) params.set("origen", origen);
    router.push(`/checkout?${params}`);
  }

  if (sinStock) {
    return (
      <p className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
        Sin stock por el momento
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 rounded-full border border-stone-300 px-2 py-1">
        <button
          type="button"
          onClick={decrementar}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-stone-600 transition hover:bg-miel-50 disabled:opacity-40"
          disabled={cantidad <= 1}
          aria-label="Restar cantidad"
        >
          −
        </button>
        <span className="w-6 text-center font-semibold">{cantidad}</span>
        <button
          type="button"
          onClick={incrementar}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-stone-600 transition hover:bg-miel-50 disabled:opacity-40"
          disabled={cantidad >= stock}
          aria-label="Sumar cantidad"
        >
          +
        </button>
      </div>
      <button type="button" onClick={comprar} className="btn-primary">
        Comprar
      </button>
      <p className="text-sm text-stone-500">{stock} unidades disponibles</p>
    </div>
  );
}
