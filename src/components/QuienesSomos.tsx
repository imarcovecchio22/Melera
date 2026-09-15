export default function QuienesSomos() {
  return (
    <section id="nosotros" className="bg-beige py-16 sm:py-24">
      <div className="container-melera grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-miel-600">
            Quiénes somos
          </span>
          <h2 className="section-title mt-2">Del campo a tu mesa</h2>
        </div>
        <div className="space-y-4 text-stone-600">
          <p>
            Melera nació de las colmenas de Tomás Jofré, un pueblo rural en el
            corazón de la provincia de Buenos Aires. Ahí, entre campos abiertos
            y flores silvestres, nuestras abejas trabajan como lo vienen
            haciendo por generaciones: sin apuro y sin atajos.
          </p>
          <p>
            Toda nuestra miel es producida por{" "}
            <strong className="text-marron">Apícola Mercedes</strong>, un
            apiario familiar con años de trayectoria en la zona. Cada frasco
            que vendemos tiene ese respaldo: trazabilidad real, cosecha
            artesanal y un compromiso genuino con la calidad.
          </p>
          <p>
            No industrializamos el proceso. Extraemos, decantamos y
            envasamos con cuidado para que la miel llegue a tu casa tal como
            sale de la colmena: pura, espesa y con todo su sabor natural.
          </p>
        </div>
      </div>
    </section>
  );
}
