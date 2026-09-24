import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Layout de las páginas públicas con el panal: /, /producto, /consultas y /privacidad.
// (El checkout y el admin tienen el suyo.)
export default function PublicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tema-panal flex min-h-screen flex-col">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
