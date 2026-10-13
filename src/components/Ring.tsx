import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

/** Halo discret : plusieurs traits de plus en plus larges et transparents, pour un bord qui s'estompe. */
const GLOW_LAYERS: readonly { extra: number; opacity: number }[] = [
  { extra: 4, opacity: 0.14 },
  { extra: 9, opacity: 0.08 },
  { extra: 14, opacity: 0.04 },
];
const GLOW_INSET = 7;

export interface RingProps {
  size?: number;
  strokeWidth?: number;
  /** de 0 à 1 */
  progress: number;
  color: string;
  trackColor?: string;
  /** halo discret autour de l'arc */
  glow?: boolean;
  accessibilityLabel?: string;
  children?: ReactNode;
}

/** Anneau de progression : durée de séance (braise) et chrono de repos (glace). */
export function Ring({
  size = 216,
  strokeWidth = 14,
  progress,
  color,
  trackColor = colors.trackSoft,
  glow = false,
  accessibilityLabel,
  children,
}: RingProps) {
  const center = size / 2;
  const r = center - strokeWidth / 2 - (glow ? GLOW_INSET : 0);
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const dash = `${clamped * circumference} ${circumference}`;
  const arc = {
    cx: center,
    cy: center,
    r,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeDasharray: dash,
    rotation: -90,
    origin: `${center}, ${center}`,
  };

  return (
    <View
      accessible={accessibilityLabel != null}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Circle cx={center} cy={center} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {clamped > 0 && glow
          ? [...GLOW_LAYERS]
              .reverse()
              .map((layer) => (
                <Circle key={layer.extra} {...arc} stroke={color} strokeOpacity={layer.opacity} strokeWidth={strokeWidth + layer.extra} />
              ))
          : null}
        {clamped > 0 ? <Circle {...arc} stroke={color} strokeWidth={strokeWidth} /> : null}
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
