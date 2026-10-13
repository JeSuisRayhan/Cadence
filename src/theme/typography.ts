import type { TextStyle } from 'react-native';

/** Noms de familles chargées dans `app/_layout.tsx` (une famille = un graisse, pas de fontWeight). */
export const fonts = {
  displayMedium: 'BricolageGrotesque_500Medium',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  display: 'BricolageGrotesque_700Bold',
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemi: 'InstrumentSans_600SemiBold',
  bodyBold: 'InstrumentSans_700Bold',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/** letterSpacing en em → px */
const em = (size: number, value: number) => Math.round(size * value * 100) / 100;

/**
 * Échelle typographique. Bricolage Grotesque pour les titres et les chiffres,
 * Instrument Sans pour le texte et les libellés.
 */
export const type = {
  // chiffres géants
  numHero: { fontFamily: fonts.display, fontSize: 108, lineHeight: 100, letterSpacing: em(108, -0.04), fontVariant: tabular },
  numXL: { fontFamily: fonts.display, fontSize: 84, lineHeight: 84, letterSpacing: em(84, -0.04), fontVariant: tabular },
  numTimer: { fontFamily: fonts.display, fontSize: 62, lineHeight: 66, letterSpacing: em(62, -0.03), fontVariant: tabular },
  numField: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, fontVariant: tabular },
  numClock: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, fontVariant: tabular },
  stat: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: em(32, -0.02), fontVariant: tabular },
  statSm: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: em(30, -0.02), fontVariant: tabular },
  choice: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, fontVariant: tabular },

  // titres
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: em(34, -0.02) },
  hero: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: em(40, -0.02) },
  h1Large: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: em(36, -0.02) },
  h1: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: em(32, -0.02) },
  h1Tight: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: em(30, -0.02) },
  h2: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, letterSpacing: em(26, -0.02) },
  h2Rest: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: em(28, -0.02) },
  h3: { fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 24, letterSpacing: em(18, -0.01) },

  // texte
  button: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 22 },
  buttonSm: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20 },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodySemi: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 20 },
  meta: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  metaSemi: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  captionMedium: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  captionSemi: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  microSemi: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16 },
  microBold: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16 },
  /** petit libellé en capitales, couleur braise */
  label: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: em(12, 0.12) },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
