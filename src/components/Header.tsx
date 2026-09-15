import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-miel-100 bg-crema/90 backdrop-blur">
      <div className="container-melera flex h-16 items-center justify-between gap-3">
        <Link href="/" className="shrink-0 font-serif text-2xl font-semibold text-miel-700">
          Melera
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
