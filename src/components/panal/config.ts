/**
 * Valores aprobados en el prototipo del panal (docs/melera-panal-prototipo.html).
 * Es el único lugar donde se ajustan: el panel de "Ajustes" del prototipo no va a producción.
 */
export const PANAL = {
  /** Radio de huida de la abeja alrededor del cursor o del dedo (px). */
  fleeRadius: 150,
  /** Velocidad de paseo de la abeja (px/s). */
  cruise: 90,
  /** Velocidad máxima al huir (px/s). */
  fleeSpeed: 420,
  /** Gotas de miel por segundo que caen del jarrón. */
  drips: 3,
  /** Intensidad de la luz cálida sobre el panal (1 = como el prototipo). */
  bright: 1,
  /** Profundidad del parallax al mover el puntero o hacer scroll (1 = como el prototipo). */
  parallax: 1,
  /** Duración de la entrada atravesando la celda (s). */
  introDur: 1.9,
} as const;

/** Clave de sessionStorage: la entrada se ve una vez por sesión. */
export const ENTRADA_VISTA_KEY = "melera-entrada-vista";
