import LogoCelda from "@/components/LogoCelda";
import Link from "next/link";
import { whatsappLink } from "@/lib/utils";

export default function Footer() {
  const numero = process.env.WHATSAPP_NUMBER ?? "";

  return (
    <footer className="relative z-[1] bg-[rgba(18,7,2,0.93)] text-[#A99270]">
      <div className="contenedor-panal flex flex-col items-center gap-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <LogoCelda tamano={40} />
          <div>
            <p className="font-serif text-lg font-semibold text-[var(--ink)]">Melera</p>
            <p className="text-sm">Miel artesanal de Tomás Jofré, Buenos Aires.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/consultas" className="btn-ghost">
            Consultas
          </Link>
          {numero && (
            <a
              href={whatsappLink(numero, "Hola! Tengo una consulta sobre Melera.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              Consultas por WhatsApp
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-xs">
        © {new Date().getFullYear()} Melera. Todos los derechos reservados. ·{" "}
        <Link href="/privacidad" className="underline underline-offset-2 hover:text-[var(--ink-soft)]">
          Privacidad
        </Link>
      </div>
    </footer>
  );
}
