"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** "Generar pendientes ahora" y "Conectar el bot a esta web". */
export default function InstagramControls({ botConectadoAqui }: { botConectadoAqui: boolean }) {
  const [loading, setLoading] = useState<"generar" | "bot" | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [confirmarBot, setConfirmarBot] = useState(false);
  const router = useRouter();

  async function llamar(tipo: "generar" | "bot") {
    setLoading(tipo);
    setMensaje(null);
    try {
      const res = await fetch(tipo === "generar" ? "/api/admin/instagram/generar" : "/api/admin/instagram/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMensaje({ ok: false, texto: data?.error ?? `Error del servidor (${res.status})` });
      } else if (tipo === "generar") {
        setMensaje({
          ok: data.errores === 0,
          texto: `${data.generados} generados, ${data.errores} con error${data.quedanPendientes ? `, quedan ${data.quedanPendientes} pendientes (volvé a tocar)` : ""}.`,
        });
      } else {
        setMensaje({ ok: true, texto: `Listo: los botones de Telegram ahora llegan a ${data.url}` });
      }
      router.refresh();
    } catch {
      setMensaje({ ok: false, texto: "No pudimos conectar con el servidor." });
    } finally {
      setLoading(null);
      setConfirmarBot(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => llamar("generar")} disabled={!!loading} className="btn-primary !px-4 !py-2 text-sm">
          {loading === "generar" ? "Generando… (hasta 1 min)" : "Generar pendientes de hoy"}
        </button>
        {!botConectadoAqui &&
          (confirmarBot ? (
            <>
              <button onClick={() => llamar("bot")} disabled={!!loading} className="btn-secondary !px-4 !py-2 text-sm">
                Sí, conectar el bot acá
              </button>
              <button onClick={() => setConfirmarBot(false)} className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600">
                Cancelar
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmarBot(true)} disabled={!!loading} className="btn-secondary !px-4 !py-2 text-sm">
              Conectar el bot a esta web
            </button>
          ))}
      </div>
      {confirmarBot && (
        <p className="text-xs text-amber-700">
          Desde ese momento los botones de Telegram los procesa esta web y no Make. Los mensajes viejos de Make dejan de funcionar.
        </p>
      )}
      {mensaje && <p className={`text-sm ${mensaje.ok ? "text-emerald-700" : "text-red-600"}`}>{mensaje.texto}</p>}
    </div>
  );
}
