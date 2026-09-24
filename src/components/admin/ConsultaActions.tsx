"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Estado = "nueva" | "respondida" | "archivada";

export default function ConsultaActions({
  consultaId,
  estadoActual,
}: {
  consultaId: number;
  estadoActual: Estado;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function cambiarEstado(estado: Estado) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/consultas/${consultaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      if (!res.ok) {
        setError("No se pudo actualizar la consulta");
      } else {
        router.refresh();
      }
    } catch {
      setError("No se pudo actualizar la consulta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {estadoActual === "nueva" ? (
          <button
            onClick={() => cambiarEstado("respondida")}
            disabled={loading}
            className="btn-primary !px-4 !py-2 text-sm"
          >
            Marcar respondida
          </button>
        ) : (
          <button
            onClick={() => cambiarEstado("nueva")}
            disabled={loading}
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            Volver a pendiente
          </button>
        )}
        <button
          onClick={() => cambiarEstado("archivada")}
          disabled={loading}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60"
        >
          Archivar
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
