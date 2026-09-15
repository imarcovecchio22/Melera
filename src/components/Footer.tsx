import { whatsappLink } from "@/lib/utils";

export default function Footer() {
  const numero = process.env.WHATSAPP_NUMBER ?? "";

  return (
    <footer className="border-t border-miel-100 bg-white">
      <div className="container-melera flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="font-serif text-xl font-semibold text-miel-700">Melera</p>
          <p className="mt-1 text-sm text-stone-500">
            Miel artesanal de Tomás Jofré, Buenos Aires.
          </p>
        </div>

        {numero && (
          <a
            href={whatsappLink(numero, "Hola! Tengo una consulta sobre Melera.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Consultas por WhatsApp
          </a>
        )}
      </div>
      <div className="border-t border-miel-100 py-4 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} Melera. Todos los derechos reservados.
      </div>
    </footer>
  );
}
