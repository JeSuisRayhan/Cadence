import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { colors, type, type TypeVariant } from '../theme';

const tones = {
  text: colors.text,
  soft: colors.textSoft,
  muted: colors.textMuted,
  subtle: colors.textSubtle,
  faint: colors.textFaint,
  ember: colors.ember,
  ice: colors.ice,
  onEmber: colors.onEmber,
  disabled: colors.textDisabled,
  danger: colors.danger,
} as const;

export type Tone = keyof typeof tones;

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
}

/** Texte de l'application : une variante typographique et une teinte, rien d'autre. */
export function Text({ variant = 'body', tone = 'text', align, style, ...rest }: TextProps) {
  const base = type[variant];
  const isLabel = variant === 'label';
  return (
    <RNText
      // les très grands chiffres gardent leur taille, le texte courant suit les réglages d'accessibilité
      maxFontSizeMultiplier={base.fontSize >= 30 ? 1.1 : 1.3}
      {...rest}
      style={[base, isLabel ? { textTransform: 'uppercase' } : null, { color: tones[tone] }, align ? { textAlign: align } : null, style]}
    />
  );
}
