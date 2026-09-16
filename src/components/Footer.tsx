import Image from "next/image";
import { whatsappLink } from "@/lib/utils";

export default function Footer() {
  const numero = process.env.WHATSAPP_NUMBER ?? "";

  return (
    <footer className="bg-[#170903]">
      <div className="container-melera flex flex-col items-center gap-6 py-12 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          <Image
            src="/brand/melera-logo-compacto-dark.svg"
            alt="Melera — Miel Artesanal"
            width={240}
            height={290}
            className="w-20"
          />
          <p className="max-w-[220px] text-sm text-[#CBB392] sm:max-w-none">
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
      <div className="border-t border-white/10 py-4 text-center text-xs text-[#8A6040]">
        © {new Date().getFullYear()} Melera. Todos los derechos reservados.
      </div>
    </footer>
  );
}
