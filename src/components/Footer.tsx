import Image from "next/image";
import Link from "next/link";
import { whatsappLink } from "@/lib/utils";

export default function Footer() {
  const numero = process.env.WHATSAPP_NUMBER ?? "";

  return (
    <footer className="bg-[#170903]">
      <div className="container-melera flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crema p-1">
            <Image src="/brand/melera-logo.png" alt="" width={28} height={28} />
          </span>
          <div>
            <p className="font-serif text-lg font-semibold text-[#FFF3DC]">Melera</p>
            <p className="text-sm text-[#CBB392]">Miel artesanal de Tomás Jofré, Buenos Aires.</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/consultas"
            className="inline-flex items-center gap-2 rounded-full border border-[#CBB392]/40 px-5 py-2.5 text-sm font-semibold text-[#FFF3DC] transition hover:bg-white/10"
          >
            Consultas
          </Link>
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
      </div>
      <div className="border-t border-white/10 py-3 text-center text-xs text-[#8A6040]">
        © {new Date().getFullYear()} Melera. Todos los derechos reservados. ·{" "}
        <Link href="/privacidad" className="underline underline-offset-2 hover:text-[#CBB392]">
          Privacidad
        </Link>
      </div>
    </footer>
  );
}
