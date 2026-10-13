import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exerciseImages } from '../../assets/images';
import { Button, IconButton, MiniPlayer, Pill, ProgressBars, Text } from '../../components';
import type { ExerciseDef } from '../../domain/catalog';
import { muscleDots } from '../../domain/labels';
import { colors, screenPadding } from '../../theme';

export interface ExerciseViewProps {
  def: ExerciseDef;
  exerciseIndex: number;
  exerciseCount: number;
  setIndex: number;
  totalSets: number;
  /** répétitions, ou secondes pour un exercice chronométré */
  target: number;
  /** secondes restantes du chrono, s'il est lancé */
  timedLeft: number | null;
  onComplete: () => void;
  onStartTimed: () => void;
  onClose: () => void;
  onStartMusic: () => void;
  /** le panneau YouTube occupe le bas de l'écran : l'image se réduit au besoin et le bouton OK n'ajoute pas la marge du bas */
  docked?: boolean;
}

/** Une série en cours : l'exercice en grand, le nombre de répétitions, et le bouton OK. */
export function ExerciseView({
  def,
  exerciseIndex,
  exerciseCount,
  setIndex,
  totalSets,
  target,
  timedLeft,
  onComplete,
  onStartTimed,
  onClose,
  onStartMusic,
  docked = false,
}: ExerciseViewProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const top = Math.max(insets.top, 12) + 10;
  const heroHeight = Math.min(400, Math.round(height * 0.474)) + (top - 22);
  const timed = def.unit === 'sec';
  const waiting = timed && timedLeft === null;
  const shown = timed && timedLeft !== null ? timedLeft : target;
  const position = `Exercice ${exerciseIndex + 1} sur ${exerciseCount}`;

  return (
    <View style={styles.root}>
      <View style={[{ height: heroHeight, minHeight: top + 150 }, styles.hero]}>
        <Image
          source={exerciseImages[def.image]}
          accessibilityLabel={def.name}
          contentFit="cover"
          contentPosition={{ left: '50%', top: '40%' }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(12,13,15,0.55)', colors.transparentBg, colors.transparentBg, colors.bg]}
          locations={[0, 0.26, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.bars, { top }]}>
          <ProgressBars total={exerciseCount} filled={exerciseIndex + 1} onImage accessibilityLabel={position} />
        </View>
        <IconButton icon="close" tone="scrim" label="Quitter la séance" onPress={onClose} style={[styles.close, { top: top + 18 }]} />
        <View style={[styles.pill, { top: top + 26 }]}>
          <Pill label={position} />
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text variant="label" tone="ember" numberOfLines={1}>
          {muscleDots(def.muscles)}
        </Text>
        <Text variant="hero" accessibilityRole="header" numberOfLines={2} style={styles.name}>
          {def.name}
        </Text>
      </View>

      <View style={styles.repsRow}>
        <View style={styles.count}>
          <Text variant="numHero" accessibilityLabel={`${shown} ${timed ? 'secondes' : 'répétitions'}`}>
            {shown}
          </Text>
          <Text variant="bodyMedium" tone="muted" style={styles.unit}>
            {timed ? 'secondes' : 'répétitions'}
          </Text>
        </View>
        <View accessible accessibilityRole="progressbar" accessibilityLabel={`Série ${setIndex + 1} sur ${totalSets}`} style={styles.sets}>
          <Text variant="metaSemi" tone="soft">
            Série {setIndex + 1} sur {totalSets}
          </Text>
          <View style={styles.setBars}>
            {Array.from({ length: totalSets }, (_, i) => (
              <View key={i} style={[styles.setBar, i <= setIndex && styles.setBarOn]} />
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: docked ? 12 : Math.max(insets.bottom, 12) + 12 }]}>
        <Button
          size="xl"
          label={waiting ? 'Démarrer' : 'OK'}
          icon={waiting ? 'play' : 'check'}
          iconPosition="left"
          accessibilityHint={waiting ? 'Lance le chrono de la série' : 'Série terminée, lance le repos'}
          onPress={waiting ? onStartTimed : onComplete}
        />
        <MiniPlayer onStart={onStartMusic} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  // l'image cède de la place quand l'écran est court (tablette en paysage avec le panneau YouTube)
  hero: { flexShrink: 1 },
  bars: { position: 'absolute', left: screenPadding, right: screenPadding, flexDirection: 'row' },
  close: { position: 'absolute', left: screenPadding },
  pill: { position: 'absolute', right: screenPadding },
  titleBlock: { marginTop: -70, marginHorizontal: screenPadding },
  name: { marginTop: 4 },
  repsRow: {
    marginTop: 14,
    marginHorizontal: screenPadding,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  count: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexShrink: 1 },
  unit: { fontSize: 18, lineHeight: 24 },
  sets: { alignItems: 'flex-end', gap: 8, paddingBottom: 6 },
  setBars: { flexDirection: 'row', gap: 6 },
  setBar: { width: 26, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  setBarOn: { backgroundColor: colors.ember },
  footer: { marginTop: 'auto', paddingTop: 12, paddingHorizontal: screenPadding, gap: 12 },
});
