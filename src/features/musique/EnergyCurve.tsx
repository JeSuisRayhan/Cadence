import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { Text } from '../../components';
import { CURVE_PATH } from '../../music/curve';
import { colors } from '../../theme';

/** Courbe d'intensité de la playlist : montée progressive, pic en fin d'effort, retour au calme. */
export function EnergyCurve() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Intensité de la playlist : montée progressive, pic au milieu, retour au calme"
    >
      <Svg width="100%" height={44} viewBox="0 0 326 44" preserveAspectRatio="none" fill="none">
        <Defs>
          <LinearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.ember} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.ember} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={`${CURVE_PATH} L326 44 L0 44 Z`} fill="url(#curveFill)" />
        <Path d={CURVE_PATH} stroke={colors.ember} strokeWidth={2} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={styles.labels}>
        <Text variant="micro" tone="subtle">
          Échauffement
        </Text>
        <Text variant="micro" tone="subtle">
          Effort
        </Text>
        <Text variant="micro" tone="subtle">
          Retour au calme
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
});
