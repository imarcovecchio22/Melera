"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Botón de prueba: libera el límite de horas entre respuestas para una cuenta. */
export default function ReiniciarLimiteIG({ usuarioIgId }: { usuarioIgId: string }) {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const router = useRouter();

  async function reiniciar() {
    setLoading(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/admin/autorespuestas/reiniciar-limite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioIgId }),
      });
      const data = await res.json().catch(() => null);
      setMensaje(
        res.ok
          ? { ok: true, texto: "Listo: el próximo mensaje de esta cuenta se responde." }
          : { ok: false, texto: data?.error ?? `Error del servidor (${res.status})` }
      );
      if (res.ok) router.refresh();
    } catch {
      setMensaje({ ok: false, texto: "No pudimos conectar con el servidor." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1">
      <button
        onClick={reiniciar}
        disabled={loading}
        className="rounded-full border border-stone-300 px-2.5 py-0.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 disabled:opacity-60"
      >
        {loading ? "Reiniciando…" : "Reiniciar límite (para pruebas)"}
      </button>
      {mensaje && <p className={`mt-1 text-xs ${mensaje.ok ? "text-emerald-700" : "text-red-600"}`}>{mensaje.texto}</p>}
    </div>
  );
}
