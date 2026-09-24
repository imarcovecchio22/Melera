"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Botón para renovar a mano el token de las respuestas automáticas. */
export default function TokenIGRenovar() {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const router = useRouter();

  async function renovar() {
    setLoading(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/admin/autorespuestas/token", { method: "POST" });
      const data = await res.json().catch(() => null);
      setMensaje(
        res.ok
          ? { ok: true, texto: `Renovado: vence el ${data?.vence}.` }
          : { ok: false, texto: data?.error ?? `Error del servidor (${res.status})` }
      );
      router.refresh();
    } catch {
      setMensaje({ ok: false, texto: "No pudimos conectar con el servidor." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button onClick={renovar} disabled={loading} className="btn-secondary !px-4 !py-2 text-sm">
        {loading ? "Renovando…" : "Renovar ahora"}
      </button>
      {mensaje && <p className={`text-xs ${mensaje.ok ? "text-emerald-700" : "text-red-600"}`}>{mensaje.texto}</p>}
    </div>
  );
}
