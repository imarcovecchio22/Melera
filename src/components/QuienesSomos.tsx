export default function QuienesSomos() {
  return (
    <section
      id="nosotros"
      className="contenedor-panal scroll-mt-4 bg-[linear-gradient(to_bottom,rgba(18,7,2,0)_0,rgba(18,7,2,0.84)_26%,rgba(18,7,2,0.93))] pb-[clamp(56px,8vw,96px)] pt-[clamp(72px,11vw,130px)]"
    >
      <div className="grid max-w-[1100px] gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="etiqueta-seccion">Quiénes somos</span>
          <h2 className="titulo-panal mt-2 max-w-[18ch]">Del campo a tu mesa</h2>
        </div>
        <div className="texto-suave space-y-4 leading-[1.65]">
          <p>
            Melera nació de las colmenas de Tomás Jofré, un pueblo rural en el corazón de la provincia de
            Buenos Aires. Ahí, entre campos abiertos y flores silvestres, nuestras abejas trabajan como lo
            vienen haciendo por generaciones: sin apuro y sin atajos.
          </p>
          <p>
            Toda nuestra miel es producida por{" "}
            <strong className="font-semibold text-[var(--ink)]">Apícola Mercedes</strong>, un apiario
            familiar con años de trayectoria en la zona. Cada frasco que vendemos tiene ese respaldo:
            trazabilidad real, cosecha artesanal y un compromiso genuino con la calidad.
          </p>
          <p>
            No industrializamos el proceso. Extraemos, decantamos y envasamos con cuidado para que la miel
            llegue a tu casa tal como sale de la colmena: pura, espesa y con todo su sabor natural.
          </p>
        </div>
      </div>
    </section>
  );
}
