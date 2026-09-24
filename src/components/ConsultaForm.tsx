"use client";

import { useRef, useState } from "react";

type Canal = "instagram" | "email";

const CANALES: { value: Canal; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "email", label: "Email" },
];

export default function ConsultaForm({ origen }: { origen?: string }) {
  const [canal, setCanal] = useState<Canal>("instagram");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviadoPor, setEnviadoPor] = useState<{ canal: Canal; contacto: string } | null>(null);
  // ms desde que se abrió el formulario (anti-spam: un bot lo completa al instante)
  const abiertoEn = useRef(Date.now());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      canal,
      origen: origen ?? "",
      tiempo: Date.now() - abiertoEn.current,
    };

    try {
      const res = await fetch("/api/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Ocurrió un error, intentá de nuevo.");
        setLoading(false);
        return;
      }

      const contacto = String(formData.get(canal) ?? "").trim();
      setEnviadoPor({
        canal,
        contacto: canal === "instagram" ? `@${contacto.replace(/^@+/, "")}` : contacto,
      });
    } catch {
      setError("No pudimos conectar con el servidor. Intentá de nuevo.");
      setLoading(false);
    }
  }

  if (enviadoPor) {
    return (
      <div className="rounded-2xl border border-miel-100 bg-white p-6 text-center shadow-soft sm:p-8">
        <p className="text-4xl" aria-hidden>
          🐝
        </p>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-marron">¡Gracias por escribirnos!</h2>
        <p className="mt-2 text-stone-600">
          Recibimos tu consulta y te vamos a responder{" "}
          {enviadoPor.canal === "instagram" ? "por mensaje directo de Instagram a " : "por email a "}
          <span className="font-semibold text-marron">{enviadoPor.contacto}</span>.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-miel-100 bg-white p-5 shadow-soft sm:p-8"
      noValidate
    >
      <div>
        <label className="label-field" htmlFor="nombre">
          Nombre
        </label>
        <input
          className="input-field"
          id="nombre"
          name="nombre"
          autoComplete="given-name"
          minLength={2}
          maxLength={80}
          required
        />
      </div>

      <fieldset>
        <legend className="label-field">¿Dónde te respondemos?</legend>
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          {CANALES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={canal === c.value}
              onClick={() => setCanal(c.value)}
              className={`min-h-[48px] rounded-lg border-2 px-4 py-2.5 font-semibold transition ${
                canal === c.value
                  ? "border-miel-500 bg-miel-50 text-miel-700"
                  : "border-stone-300 bg-white text-stone-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      {canal === "instagram" ? (
        <div key="instagram">
          <label className="label-field" htmlFor="instagram">
            Tu usuario de Instagram
          </label>
          <input
            className="input-field"
            id="instagram"
            name="instagram"
            placeholder="@tuusuario"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>
      ) : (
        <div key="email">
          <label className="label-field" htmlFor="email">
            Tu email
          </label>
          <input
            className="input-field"
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@email.com"
            required
          />
        </div>
      )}

      <div>
        <label className="label-field" htmlFor="mensaje">
          Tu consulta
        </label>
        <textarea
          className="input-field min-h-[140px] resize-y"
          id="mensaje"
          name="mensaje"
          minLength={5}
          maxLength={1500}
          required
        />
      </div>

      {/* Honeypot: invisible para las personas, los bots lo completan */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="empresa">Empresa</label>
        <input id="empresa" name="empresa" tabIndex={-1} autoComplete="off" />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar consulta"}
      </button>
    </form>
  );
}
