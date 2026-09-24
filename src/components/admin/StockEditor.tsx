"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@prisma/client";

export default function StockEditor({ product }: { product: Product }) {
  const [stock, setStock] = useState(product.stock);
  const [precio, setPrecio] = useState(product.precio);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      const res = await fetch("/api/admin/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, stock, precio }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMensaje(data?.error ?? "No se pudo guardar");
      } else {
        setMensaje("Cambios guardados");
        router.refresh();
      }
    } catch {
      setMensaje("No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-miel-100 bg-white p-6 shadow-soft">
      <h2 className="font-semibold text-marron">{product.nombre}</h2>
      <p className="mt-1 text-sm text-stone-500">Precio del frasco y unidades disponibles</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[140px] flex-1">
          <label className="label-field" htmlFor="precio">Precio (pesos)</label>
          <input
            id="precio"
            type="number"
            min={1}
            step={1}
            className="input-field"
            value={precio}
            onChange={(e) => setPrecio(Number(e.target.value))}
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="label-field" htmlFor="stock">Unidades</label>
          <input
            id="stock"
            type="number"
            min={0}
            className="input-field"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {mensaje && <p className="mt-3 text-sm text-stone-600">{mensaje}</p>}
    </form>
  );
}
