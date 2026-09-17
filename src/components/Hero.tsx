import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="overflow-hidden bg-gradient-to-b from-miel-50 to-crema">
      <div className="container-melera grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:py-28">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <Image
            src="/brand/melera-logo.png"
            alt="Melera — Miel Artesanal, del campo a tu mesa"
            width={1024}
            height={1024}
            priority
            className="mx-auto mb-6 w-36 sm:w-44 lg:mx-0"
          />
          <h1 className="font-caveat text-6xl font-bold leading-tight text-marron sm:text-7xl">
            Miel artesanal, pura y natural
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-stone-600 lg:mx-0">
            Producida por Apícola Mercedes en Tomás Jofré, Buenos Aires. Sin
            aditivos, sin procesos industriales — tal cual sale de la colmena.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/producto" className="btn-primary">
              Comprar ahora
            </Link>
            <Link href="/#nosotros" className="btn-secondary">
              Conocé nuestra historia
            </Link>
          </div>
        </div>
        <div className="order-1 flex justify-center lg:order-2">
          <Image
            src="/producto-miel.png"
            alt="Frasco de miel artesanal Melera"
            width={433}
            height={577}
            priority
            className="h-auto w-64 sm:w-80 lg:w-96"
          />
        </div>
      </div>
    </section>
  );
}
