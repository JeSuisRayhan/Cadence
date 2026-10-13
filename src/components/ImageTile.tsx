import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme';
import { Icon } from './Icon';

export interface ImageTileProps {
  source: number;
  selected: boolean;
  onPress: () => void;
  /** libellé lu par les lecteurs d'écran */
  label: string;
  /** hauteur et largeur (ou flex) de la tuile */
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** début du dégradé sombre, de 0 (haut) à 1 (bas) */
  fadeFrom?: number;
  /** opacité du voile posé sur les tuiles non choisies */
  dim?: number;
  indicatorSize?: number;
  indicatorInset?: number;
  /** position du contenu (étiquette) sur l'image */
  contentStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Tuile image à choisir : niveau, muscle, lieu, style musical.
 * Choisie : liseré braise et pastille cochée. Non choisie : image voilée.
 */
export function ImageTile({
  source,
  selected,
  onPress,
  label,
  style,
  radius = 20,
  fadeFrom = 0.45,
  dim = 0.42,
  indicatorSize = 22,
  indicatorInset = 8,
  contentStyle,
  children,
}: ImageTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { borderRadius: radius }, pressed && styles.pressed, style]}
    >
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        pointerEvents="none"
        colors={[colors.transparentBg, 'rgba(12,13,15,0.88)']}
        locations={[fadeFrom, 1]}
        style={StyleSheet.absoluteFill}
      />
      {selected ? null : (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(12,13,15,${dim})` }]} />
      )}
      <View pointerEvents="none" style={contentStyle}>
        {children}
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.indicator,
          { top: indicatorInset, right: indicatorInset, width: indicatorSize, height: indicatorSize, borderRadius: indicatorSize / 2 },
          selected ? styles.indicatorOn : styles.indicatorOff,
        ]}
      >
        {selected ? (
          <Icon name="check" size={Math.round(indicatorSize * 0.58)} color={colors.onEmber} strokeWidth={3.2} />
        ) : null}
      </View>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, borderCurve: 'continuous', borderWidth: selected ? 2.5 : 1 },
          { borderColor: selected ? colors.ember : colors.borderSoft },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  pressed: { opacity: 0.9 },
  indicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorOn: { backgroundColor: colors.ember },
  indicatorOff: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
});
