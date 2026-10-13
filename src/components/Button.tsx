import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, sizes } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'outline' | 'quiet' | 'danger';
type Size = 'md' | 'lg' | 'xl';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<Size, number> = { md: sizes.buttonMd, lg: sizes.buttonLg, xl: sizes.buttonXl };
const ICON_SIZE: Record<Size, number> = { md: 18, lg: 18, xl: 24 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'right',
  disabled = false,
  accessibilityHint,
  style,
}: ButtonProps) {
  const height = HEIGHT[size];
  const tone = disabled
    ? 'disabled'
    : variant === 'primary'
      ? 'onEmber'
      : variant === 'quiet'
        ? 'soft'
        : variant === 'danger'
          ? 'danger'
          : 'text';
  const iconColor = disabled ? colors.textDisabled : variant === 'primary' ? colors.onEmber : variant === 'danger' ? colors.danger : colors.text;
  const textVariant = size === 'xl' ? 'choice' : size === 'md' ? 'buttonSm' : 'button';
  const glyph = icon ? (
    <Icon
      name={icon}
      size={ICON_SIZE[size]}
      color={iconColor}
      strokeWidth={size === 'xl' ? 2.6 : variant === 'outline' ? 2 : 1.9}
    />
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height, borderRadius: height / 2 },
        variant === 'primary' && { backgroundColor: disabled ? colors.surfaceRaised : colors.ember },
        variant === 'outline' && styles.outline,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {iconPosition === 'left' ? glyph : null}
        <Text variant={textVariant} tone={tone} numberOfLines={1}>
          {label}
        </Text>
        {iconPosition === 'right' ? glyph : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderCurve: 'continuous',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  pressed: {
    opacity: 0.85,
  },
});
