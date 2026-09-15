"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@prisma/client";

export default function StockEditor({ product }: { product: Product }) {
  const [stock, setStock] = useState(product.stock);
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
        body: JSON.stringify({ productId: product.id, stock }),
      });

      if (!res.ok) {
        setMensaje("No se pudo actualizar el stock");
      } else {
        setMensaje("Stock actualizado");
        router.refresh();
      }
    } catch {
      setMensaje("No se pudo actualizar el stock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-miel-100 bg-white p-6 shadow-soft">
      <h2 className="font-semibold text-stone-800">{product.nombre}</h2>
      <p className="mt-1 text-sm text-stone-500">Stock disponible</p>

      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1">
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
