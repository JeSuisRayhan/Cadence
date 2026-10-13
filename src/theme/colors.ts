/**
 * Palette de Cadence — sombre uniquement.
 * Braise (action) et glace (repos) sont les deux seules couleurs vives.
 */
export const colors = {
  // surfaces
  bg: '#0C0D0F',
  surface: '#15171A',
  surfaceRaised: '#1E2024',
  surfaceWarm: '#1B1816',
  surfaceMuted: '#2A2C31',

  // texte
  text: '#F3F0EA',
  textSoft: '#DAD7D1',
  textMuted: '#A9A7A2',
  textSubtle: '#94928E',
  textFaint: '#6F6D69',
  textDisabled: '#8A8884',

  // couleurs vives
  ember: '#FF6A3D',
  emberTint: 'rgba(255,106,61,0.14)',
  emberWash: 'rgba(255,106,61,0.16)',
  emberLine: 'rgba(255,106,61,0.55)',
  onEmber: '#0C0D0F',
  ice: '#8FD3E8',

  // traits et contours
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.09)',
  borderSoft: 'rgba(255,255,255,0.12)',
  outline: 'rgba(255,255,255,0.22)',
  outlineStrong: 'rgba(255,255,255,0.26)',

  // pistes de progression
  track: 'rgba(255,255,255,0.14)',
  trackSoft: 'rgba(255,255,255,0.08)',
  trackOnImage: 'rgba(255,255,255,0.28)',

  // voiles sur les images
  scrim: 'rgba(12,13,15,0.64)',
  scrimSoft: 'rgba(12,13,15,0.42)',
  transparentBg: 'rgba(12,13,15,0)',

  // alertes
  danger: '#FF8A7A',
} as const;

export type ColorName = keyof typeof colors;
