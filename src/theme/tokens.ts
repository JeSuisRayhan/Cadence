/** Espacements (grille de 4), rayons, ombres et mouvements. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Marge latérale commune à tous les écrans. */
export const screenPadding = 20;

export const radius = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 22,
  card: 24,
  panel: 26,
  hero: 28,
  pill: 999,
} as const;

export const sizes = {
  /** bouton principal en bas d'écran */
  buttonLg: 56,
  buttonXl: 64,
  buttonMd: 44,
  /** zone tactile minimale */
  touch: 44,
  tabBar: 76,
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

/** Les ombres sont rares : une seule lueur braise pour les anneaux. */
export const shadows = {
  emberGlow: '0px 0px 10px rgba(255,106,61,0.35)',
} as const;
