import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';

export interface IconButtonProps {
  icon: IconName;
  /** libellé lu par les lecteurs d'écran */
  label: string;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  strokeWidth?: number;
  /** `surface` : bouton sur le fond ; `scrim` : bouton posé sur une image */
  tone?: 'surface' | 'scrim';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  label,
  onPress,
  size = 44,
  iconSize = 22,
  strokeWidth = 1.8,
  tone = 'surface',
  disabled = false,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        tone === 'surface' ? styles.surface : styles.scrim,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={colors.text} strokeWidth={strokeWidth} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  surface: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  scrim: { backgroundColor: colors.scrim },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
});
