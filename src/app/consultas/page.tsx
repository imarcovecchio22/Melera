import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConsultaForm from "@/components/ConsultaForm";
import { getMainProduct } from "@/lib/product";
import { formatPrecio } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Consultas | Melera",
  description:
    "¿Tenés alguna duda sobre nuestra miel artesanal? Mirá las preguntas frecuentes o escribinos y te respondemos por Instagram o por email.",
};

export default async function ConsultasPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ origen?: string | string[] }>;
}) {
  const searchParams = await searchParamsPromise;
  const product = await getMainProduct();
  const origen = Array.isArray(searchParams.origen) ? searchParams.origen[0] : searchParams.origen;

  const preguntas: { pregunta: string; respuesta: React.ReactNode }[] = [
    {
      pregunta: "¿Cuánto sale el frasco?",
      respuesta: `El frasco de ${product.nombre} sale ${formatPrecio(product.precio)}.`,
    },
    {
      pregunta: "¿Hacen envíos? ¿A qué zonas?",
      respuesta: (
        <>
          Sí, hacemos envíos a CABA. Para otras zonas lo coordinamos con vos:{" "}
          <a href="#escribinos" className="font-semibold text-miel-700 underline underline-offset-4">
            escribinos acá abajo
          </a>{" "}
          y te contamos las opciones.
        </>
      ),
    },
    {
      pregunta: "¿Cómo puedo pagar?",
      respuesta: "Pagás online con Mercado Pago, al finalizar la compra en la web.",
    },
    {
      pregunta: "¿De dónde viene la miel?",
      respuesta:
        "De Apícola Mercedes, en Tomás Jofré, Buenos Aires. Cada frasco llega con su etiqueta original y certificación.",
    },
    {
      pregunta: "¿Es normal que la miel se ponga dura?",
      respuesta:
        "Sí. La miel pura cristaliza con el frío, es una señal de que es natural. Para que vuelva a estar líquida, entibiala a baño María.",
    },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 container-melera py-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="section-title">¿Tenés alguna consulta?</h1>
          <p className="mt-3 text-stone-600">
            Mirá si tu duda ya está respondida acá abajo. Si no, escribinos y te contestamos a la
            brevedad.
          </p>

          <section aria-labelledby="faq" className="mt-8">
            <h2 id="faq" className="font-serif text-xl font-semibold text-marron">
              Preguntas frecuentes
            </h2>
            <div className="mt-4 divide-y divide-miel-100 rounded-2xl border border-miel-100 bg-white">
              {preguntas.map((p) => (
                <details key={p.pregunta} className="group">
                  <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-medium text-marron [&::-webkit-details-marker]:hidden">
                    {p.pregunta}
                    <span
                      className="shrink-0 text-xl text-miel-600 transition group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-4 leading-relaxed text-stone-600">{p.respuesta}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="escribinos" aria-labelledby="escribinos-titulo" className="mt-10 scroll-mt-20">
            <h2 id="escribinos-titulo" className="mb-4 font-serif text-xl font-semibold text-marron">
              Escribinos
            </h2>
            <ConsultaForm origen={origen} />
          </section>

          <p className="mt-8 text-center text-stone-600">
            ¿Ya sabés lo que querés?{" "}
            <Link
              href={origen ? `/producto?origen=${encodeURIComponent(origen)}` : "/producto"}
              className="font-semibold text-miel-700 underline underline-offset-4">
              Comprá directo acá
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
