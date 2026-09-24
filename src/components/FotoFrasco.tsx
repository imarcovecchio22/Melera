import Image from "next/image";

/**
 * Foto del frasco (/producto-miel.png, sin fondo) con el resplandor cálido y la sombra del panal.
 * `lcp` solo donde es el elemento del LCP (hero de la home y /producto): se pide enseguida y con
 * prioridad alta (en Next 16 `priority` quedó obsoleto y no subía la prioridad de la descarga).
 */
export default function FotoFrasco({
  lcp = false,
  sizes,
  className = "",
  imgClassName = "",
}: {
  lcp?: boolean;
  sizes: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`foto-frasco ${className}`}>
      <Image
        src="/producto-miel.png"
        alt="Frasco de miel artesanal Melera"
        width={433}
        height={577}
        loading={lcp ? "eager" : "lazy"}
        fetchPriority={lcp ? "high" : "auto"}
        sizes={sizes}
        className={imgClassName}
      />
    </div>
  );
}
