import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-miel-100 bg-crema/90 backdrop-blur">
      <div className="container-melera flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/brand/melera-logo.png" alt="Melera" width={48} height={48} priority />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-stone-600 sm:gap-6">
          <Link href="/#producto" className="hidden hover:text-miel-600 sm:inline">
            Producto
          </Link>
          <Link href="/#nosotros" className="hidden hover:text-miel-600 sm:inline">
            Quiénes somos
          </Link>
          <Link href="/producto" className="btn-primary !px-4 !py-2 text-sm">
            Comprar
          </Link>
        </nav>
      </div>
    </header>
  );
}
