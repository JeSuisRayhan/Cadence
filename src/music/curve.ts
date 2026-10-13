/**
 * Courbe d'énergie d'une séance : échauffement doux, effort soutenu en fin de séance, retour au calme.
 * Chaque point est (position dans la séance de 0 à 1, énergie de 0 à 1).
 */
export const ENERGY_POINTS: readonly (readonly [number, number])[] = [
  [0, 0.1],
  [0.15, 0.35],
  [0.3, 0.62],
  [0.5, 0.9],
  [0.64, 1],
  [0.8, 0.85],
  [0.92, 0.45],
  [1, 0.08],
];

export const energyAt = (position: number): number => {
  const t = Math.min(1, Math.max(0, position));
  for (let i = 1; i < ENERGY_POINTS.length; i += 1) {
    const [x1, y1] = ENERGY_POINTS[i];
    if (t <= x1) {
      const [x0, y0] = ENERGY_POINTS[i - 1];
      return y0 + ((t - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return ENERGY_POINTS[ENERGY_POINTS.length - 1][1];
};

/** Vitesse visée pour une énergie donnée (échelle de Jamendo et d'Audius) : 0 = très lent … 4 = très rapide. */
export const speedRankFor = (energy: number): number => Math.round(Math.min(1, Math.max(0, energy)) * 4);

const SPEEDS = ['verylow', 'low', 'medium', 'high', 'veryhigh'] as const;

export const speedRankOf = (speed: unknown): number => {
  const index = typeof speed === 'string' ? SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) : -1;
  return index === -1 ? 2 : index;
};

/** Tracé de la courbe dans la maquette (boîte de 326 × 44). */
export const CURVE_PATH = 'M0 38 C40 36 60 26 100 20 S170 8 210 8 S280 12 326 36';
