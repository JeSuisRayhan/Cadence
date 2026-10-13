import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet } from 'react-native';
import { colors, motion } from '../theme';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
}

const TRACK_W = 50;
const KNOB = 24;
const INSET = 3;

/** Interrupteur de la maquette : piste 50 × 30, zone tactile 64 × 44. */
export function Switch({ value, onValueChange, label }: SwitchProps) {
  const [position] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(position, {
      toValue: value ? 1 : 0,
      duration: motion.fast,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [position, value]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={styles.hit}
    >
      <Animated.View style={[styles.track, { backgroundColor: value ? colors.ember : colors.surfaceMuted }]}>
        <Animated.View
          style={[
            styles.knob,
            {
              backgroundColor: value ? colors.onEmber : colors.textMuted,
              transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, TRACK_W - KNOB - INSET * 2] }) }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
  track: { width: TRACK_W, height: 30, borderRadius: 15 },
  knob: { position: 'absolute', top: INSET, left: INSET, width: KNOB, height: KNOB, borderRadius: KNOB / 2 },
});
