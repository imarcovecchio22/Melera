import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PanalDiferido from "@/components/panal/PanalDiferido";
import { SALTAR_VELO, SCRIPT_VELO } from "@/components/panal/velo";

// Primer cuadro de la entrada, en HTML y CSS (el canvas lo reemplaza apenas carga).
const VELO_HTML = `<svg viewBox="-110 -110 220 220" aria-hidden="true"><polygon points="0,-100 86.6,-50 86.6,50 0,100 -86.6,50 -86.6,-50" fill="#120702" stroke="#B8650A" stroke-width="9" stroke-linejoin="round"/></svg><img src="/brand/melera-logo.png" alt="" /><button type="button" class="boton-saltar" onclick='${SALTAR_VELO}'>Saltar</button>`;

// Layout de las páginas públicas con el panal: /, /producto, /consultas y /privacidad.
// (El checkout y el admin tienen el suyo.)
export default function PublicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tema-panal flex min-h-screen flex-col">
      {/* Antes de pintar: ¿hay que mostrar la entrada? (home, primera vez en la sesión) */}
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_VELO }} />
      <div className="velo-entrada" dangerouslySetInnerHTML={{ __html: VELO_HTML }} />
      <Header />
      {children}
      <Footer />
      <PanalDiferido />
    </div>
  );
}
