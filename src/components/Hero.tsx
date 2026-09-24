import Link from "next/link";
import FotoFrasco from "@/components/FotoFrasco";
import { formatPrecio } from "@/lib/utils";

export default function Hero({ precio }: { precio: number }) {
  return (
    <section
      aria-labelledby="titulo-hero"
      className="contenedor-panal grid min-h-[calc(100svh-80px)] content-center gap-5 pb-[clamp(36px,8vh,100px)] pt-1 sm:min-h-[calc(100svh-92px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-10"
    >
      {/* Mobile: la foto arriba del título (hasta 34svh). Escritorio: a la derecha, grande. */}
      <FotoFrasco
        lcp
        sizes="(min-width: 1024px) 460px, 260px"
        className="lg:order-2"
        imgClassName="h-[34svh] w-auto lg:h-[min(68svh,600px)]"
      />
      <div className="velo-texto max-w-[37rem] lg:order-1">
        <h1 id="titulo-hero" className="titulo-hero mb-[1.15rem]">
          Miel artesanal, pura y natural
        </h1>
        <p className="texto-suave mb-6 max-w-[31rem] text-[clamp(1rem,1.25vw,1.13rem)] leading-[1.65]">
          Producida por Apícola Mercedes en Tomás Jofré, Buenos Aires. Sin aditivos, sin procesos
          industriales — tal cual sale de la colmena.
        </p>
        <p className="mb-[1.6rem] flex items-baseline gap-2.5">
          <span className="precio-panal text-[2.3rem]">{formatPrecio(precio)}</span>
          <span className="texto-suave">el frasco de 500 g</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-[1.4rem] gap-y-3">
          <span className="wrap-focus">
            <Link href="/producto" className="btn-panal" data-bee-avoid>
              Comprar ahora
            </Link>
          </span>
          <Link href="/#nosotros" className="btn-ghost">
            Conocé nuestra historia
          </Link>
        </div>
      </div>
    </section>
  );
}
