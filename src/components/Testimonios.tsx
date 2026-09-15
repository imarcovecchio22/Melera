const testimonios = [
  {
    nombre: "Cliente satisfecho",
    texto:
      "Reseñas próximamente. Sé de los primeros en probar la miel de Melera y contarnos tu experiencia.",
  },
  {
    nombre: "Cliente satisfecho",
    texto: "Espacio reservado para testimonios reales de nuestros clientes.",
  },
  {
    nombre: "Cliente satisfecho",
    texto: "Espacio reservado para testimonios reales de nuestros clientes.",
  },
];

export default function Testimonios() {
  return (
    <section className="bg-beige py-16 sm:py-24">
      <div className="container-melera">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-miel-600">
            Testimonios
          </span>
          <h2 className="section-title mt-2">Lo que dicen nuestros clientes</h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {testimonios.map((t, i) => (
            <blockquote
              key={i}
              className="rounded-2xl border border-miel-100 bg-crema p-6 text-stone-600"
            >
              <p className="italic">&ldquo;{t.texto}&rdquo;</p>
              <footer className="mt-4 text-sm font-semibold text-marron">
                — {t.nombre}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
