import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import { thumbImages } from '../assets/images';
import { getExercise } from '../domain/catalog';
import { colors } from '../theme';

export interface ExerciseThumbProps {
  exerciseId: string;
  size: number;
  radius?: number;
}

/** Vignette carrée d'un exercice (zoom sur le mouvement). */
export function ExerciseThumb({ exerciseId, size, radius }: ExerciseThumbProps) {
  const def = getExercise(exerciseId);
  return (
    <Image
      source={thumbImages[def.image]}
      accessibilityLabel={def.name}
      contentFit="cover"
      style={[styles.thumb, { width: size, height: size, borderRadius: radius ?? Math.round(size * 0.28) }]}
    />
  );
}

const styles = StyleSheet.create({
  thumb: { backgroundColor: colors.bg, flexShrink: 0 },
});
