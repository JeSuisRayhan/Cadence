import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export interface ProgressBarsProps {
  total: number;
  /** nombre de barres pleines */
  filled: number;
  accessibilityLabel: string;
  /** barres posées sur une image : piste plus claire */
  onImage?: boolean;
  /** barre en cours, affichée à moitié (facultatif) */
  activeIndex?: number;
  height?: number;
}

/** Rangée de barres de progression : étapes de création, exercices de la séance. */
export function ProgressBars({ total, filled, accessibilityLabel, onImage = false, activeIndex, height = 4 }: ProgressBarsProps) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const on = i < filled;
        const active = i === activeIndex;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              { height, borderRadius: height / 2 },
              { backgroundColor: on || active ? colors.ember : onImage ? colors.trackOnImage : colors.track },
              active && !on && { opacity: 0.55 },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', gap: 6 },
  bar: { flex: 1 },
});
