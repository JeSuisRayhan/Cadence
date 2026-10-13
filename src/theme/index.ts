import { colors } from './colors';
import { fonts, type } from './typography';
import { motion, radius, screenPadding, shadows, sizes, space } from './tokens';

export { colors, type ColorName } from './colors';
export { fonts, type, type TypeVariant } from './typography';
export { space, screenPadding, radius, sizes, motion, shadows } from './tokens';

/** Point d'entrée unique du thème. */
export const theme = { colors, fonts, type, space, screenPadding, radius, sizes, motion, shadows } as const;
