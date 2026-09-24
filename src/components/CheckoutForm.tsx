"use client";

import { useState } from "react";
import { formatPrecio } from "@/lib/utils";

type Props = {
  producto: { nombre: string; precio: number };
  cantidadInicial: number;
  origen?: string;
};

const PROVINCIAS = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export default function CheckoutForm({ producto, cantidadInicial, origen }: Props) {
  const [cantidad, setCantidad] = useState(cantidadInicial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.cantidad = String(cantidad);
    if (origen) payload.origen = origen;

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error, intentá de nuevo.");
        setLoading(false);
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setError("No pudimos conectar con el servidor. Intentá de nuevo.");
      setLoading(false);
    }
  }

  const total = producto.precio * cantidad;

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3 lg:gap-12">
      <div className="space-y-6 lg:col-span-2">
        <fieldset className="space-y-4">
          <legend className="mb-1 font-serif text-xl font-semibold text-marron">
            Tus datos
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="nombre">Nombre</label>
              <input className="input-field" id="nombre" name="nombre" required />
            </div>
            <div>
              <label className="label-field" htmlFor="apellido">Apellido</label>
              <input className="input-field" id="apellido" name="apellido" required />
            </div>
            <div>
              <label className="label-field" htmlFor="email">Email</label>
              <input className="input-field" id="email" name="email" type="email" required />
            </div>
            <div>
              <label className="label-field" htmlFor="telefono">Teléfono</label>
              <input className="input-field" id="telefono" name="telefono" type="tel" required />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 font-serif text-xl font-semibold text-marron">
            Dirección de entrega
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label-field" htmlFor="calle">Calle</label>
              <input className="input-field" id="calle" name="calle" required />
            </div>
            <div>
              <label className="label-field" htmlFor="numero_dir">Número</label>
              <input className="input-field" id="numero_dir" name="numero_dir" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label-field" htmlFor="pisoDepto">Piso / Depto (opcional)</label>
              <input className="input-field" id="pisoDepto" name="pisoDepto" />
            </div>
            <div>
              <label className="label-field" htmlFor="localidad">Localidad</label>
              <input className="input-field" id="localidad" name="localidad" required />
            </div>
            <div>
              <label className="label-field" htmlFor="codigoPostal">Código postal</label>
              <input className="input-field" id="codigoPostal" name="codigoPostal" required />
            </div>
          </div>
          <div>
            <label className="label-field" htmlFor="provincia">Provincia</label>
            <select className="input-field" id="provincia" name="provincia" required defaultValue="">
              <option value="" disabled>Seleccioná una provincia</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </fieldset>
      </div>

      <div className="h-fit rounded-2xl border border-miel-100 bg-white p-6 shadow-soft">
        <h2 className="font-serif text-xl font-semibold text-marron">Resumen</h2>
        <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
          <span>{producto.nombre}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-sm disabled:opacity-40"
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              disabled={cantidad <= 1}
              aria-label="Restar cantidad"
            >
              −
            </button>
            <span className="w-4 text-center">{cantidad}</span>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-sm"
              onClick={() => setCantidad((c) => c + 1)}
              aria-label="Sumar cantidad"
            >
              +
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-miel-100 pt-4 font-semibold text-marron">
          <span>Total</span>
          <span>{formatPrecio(total)}</span>
        </div>
        <p className="mt-2 text-xs text-stone-400">
          El costo de envío se coordina por WhatsApp luego de la compra.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Redirigiendo a MercadoPago..." : "Ir a pagar"}
        </button>
      </div>
    </form>
  );
}
