import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad | Melera",
  description: "Qué datos recibe Melera cuando nos escribís por Instagram o compras en la web, para qué los usamos y cómo pedir que los borremos.",
};

// TODO: agregar un email de contacto de Melera (por ahora se piden las bajas por /consultas o por DM).
const ACTUALIZADA = "25 de septiembre de 2026";

export default function PrivacidadPage() {
  return (
    <>
      <main className="flex-1 container-melera py-10 sm:py-16">
        <article className="mx-auto max-w-2xl space-y-6 leading-relaxed text-stone-700">
          <div>
            <h1 className="section-title">Política de privacidad</h1>
            <p className="mt-2 text-sm text-stone-500">Última actualización: {ACTUALIZADA}</p>
          </div>

          <p>
            Melera (miel artesanal de Tomás Jofré, Buenos Aires) cuida los datos de las personas que nos escriben y nos
            compran. Esta página explica qué datos recibimos, para qué los usamos y cómo pedir que los borremos.
          </p>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-semibold text-marron">Qué datos recibimos de Instagram</h2>
            <p>
              Cuando le mandás un mensaje directo a <strong>@melera.miel</strong> o comentás una de nuestras
              publicaciones, Instagram (Meta) nos envía el texto del mensaje o del comentario y un identificador de tu
              cuenta que asigna Instagram. No recibimos tu contraseña, tus contactos ni otros datos de tu cuenta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-semibold text-marron">Para qué los usamos</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Para responderte automáticamente con información de la miel, el precio y los links para comprar o consultar.</li>
              <li>Para no mandarte la misma respuesta repetida y para revisar que las respuestas funcionen bien.</li>
              <li>
                Si comprás o nos dejás una consulta en la web, usamos los datos que cargás (nombre, contacto y dirección
                de envío) solo para gestionar tu pedido o responderte. Los pagos los procesa Mercado Pago: nosotros no
                vemos ni guardamos los datos de tu tarjeta.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-semibold text-marron">Lo que no hacemos</h2>
            <p>
              No vendemos, alquilamos ni compartimos tus datos con terceros para publicidad. Solo los usan los servicios
              que necesitamos para funcionar (Instagram/Meta para los mensajes, Mercado Pago para los pagos y nuestro
              proveedor de hosting y base de datos).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-semibold text-marron">Cuánto tiempo los guardamos</h2>
            <p>
              Los mensajes recibidos por Instagram se guardan solo el tiempo necesario para responder y revisar el
              funcionamiento. Los datos de pedidos se guardan mientras haga falta para el envío y por obligaciones
              legales.
            </p>
          </section>

          <section id="borrar-datos" className="space-y-2 scroll-mt-20">
            <h2 className="font-serif text-xl font-semibold text-marron">Cómo pedir que borremos tus datos</h2>
            <p>
              Podés pedir que borremos tus datos cuando quieras, sin costo: mandanos un mensaje directo a{" "}
              <a href="https://instagram.com/melera.miel" className="font-semibold text-miel-700 underline underline-offset-4" target="_blank" rel="noopener noreferrer">
                @melera.miel
              </a>{" "}
              o escribinos desde{" "}
              <Link href="/consultas" className="font-semibold text-miel-700 underline underline-offset-4">
                la página de consultas
              </Link>{" "}
              diciendo &quot;borrar mis datos&quot;. Los eliminamos dentro de los 30 días y te avisamos cuando esté hecho.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-xl font-semibold text-marron">Cambios</h2>
            <p>Si cambiamos esta política, vas a ver la nueva versión en esta misma página con la fecha actualizada.</p>
          </section>
        </article>
      </main>
    </>
  );
}
