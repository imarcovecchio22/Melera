"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ESTADOS_LABEL } from "@/lib/utils";

const ESTADOS = [
  "pendiente",
  "pagado",
  "en_preparacion",
  "enviado",
  "entregado",
  "cancelado",
] as const;

export default function OrderStatusSelect({
  orderId,
  estadoActual,
}: {
  orderId: string;
  estadoActual: string;
}) {
  const [estado, setEstado] = useState(estadoActual);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevoEstado = e.target.value;
    setEstado(nuevoEstado);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/pedidos/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) {
        setError("No se pudo actualizar el estado");
        setEstado(estadoActual);
      } else {
        router.refresh();
      }
    } catch {
      setError("No se pudo actualizar el estado");
      setEstado(estadoActual);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <select
        className="input-field"
        value={estado}
        onChange={handleChange}
        disabled={loading}
      >
        {ESTADOS.map((e) => (
          <option key={e} value={e}>
            {ESTADOS_LABEL[e]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
