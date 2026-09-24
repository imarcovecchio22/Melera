import Image from "next/image";

/**
 * Foto del frasco (/producto-miel.png, sin fondo) con el resplandor cálido y la sombra del panal.
 * `priority` solo donde es el LCP (hero de la home y /producto).
 */
export default function FotoFrasco({
  priority = false,
  sizes,
  className = "",
  imgClassName = "",
}: {
  priority?: boolean;
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
        priority={priority}
        sizes={sizes}
        className={imgClassName}
      />
    </div>
  );
}
