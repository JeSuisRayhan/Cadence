import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export interface CardProps extends ViewProps {
  radiusSize?: keyof typeof radius;
  style?: StyleProp<ViewStyle>;
}

/** Surface arrondie, le conteneur de base des écrans. */
export function Card({ radiusSize = 'xxl', style, ...rest }: CardProps) {
  return <View {...rest} style={[styles.card, { borderRadius: radius[radiusSize] }, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
});
