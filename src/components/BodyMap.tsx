import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { bodyImages } from '../assets/images';
import { MUSCLES, muscleSentence } from '../domain/labels';
import type { Muscle } from '../domain/types';

export interface BodyMapProps {
  muscles: readonly Muscle[];
  width: number;
}

const RATIO = 465 / 480;

/** Schéma du corps (face et dos) avec les muscles travaillés en surbrillance. */
export function BodyMap({ muscles, width }: BodyMapProps) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Muscles travaillés : ${muscleSentence(muscles)}`}
      style={{ width, height: width * RATIO }}
    >
      <Image source={bodyImages.base} style={StyleSheet.absoluteFill} contentFit="contain" />
      {MUSCLES.filter((m) => muscles.includes(m)).map((m) => (
        <Image key={m} source={bodyImages[m]} style={StyleSheet.absoluteFill} contentFit="contain" />
      ))}
    </View>
  );
}
