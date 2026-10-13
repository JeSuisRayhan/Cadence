import { Image } from 'expo-image';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { coverImages } from '../../../assets/images';
import { Button, Card, ExerciseThumb, Icon, IconButton, MetaRow, Screen, SectionTitle, Text } from '../../../components';
import { getExercise } from '../../../domain/catalog';
import { formatSets, formatTarget } from '../../../domain/format';
import { MUSCLE_LABEL, muscleDots } from '../../../domain/labels';
import type { PlannedExercise } from '../../../domain/types';
import { musicSummary } from '../../../music/session';
import { findSession, useAppStore } from '../../../store';
import { colors } from '../../../theme';

/** « 3 séries chacun » quand elles sont toutes égales, sinon le total. */
const setsSummary = (exercises: readonly PlannedExercise[]): string => {
  const first = exercises[0]?.sets ?? 0;
  if (exercises.every((e) => e.sets === first)) return `${formatSets(first)} chacun`;
  return formatSets(exercises.reduce((sum, e) => sum + e.sets, 0));
};

export default function SessionOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const programs = useAppStore((s) => s.programs);
  const music = useAppStore((s) => s.music);
  const found = findSession(programs, id);

  // la séance n'existe plus (programme supprimé) : retour à l'accueil
  if (!found) return <Redirect href="/" />;
  const { session } = found;

  return (
    <Screen
      scroll
      header={<IconButton icon="back" label="Retour" onPress={() => router.back()} />}
      footer={
        <Button
          label="Lancer la séance"
          icon="play"
          onPress={() => router.push({ pathname: '/seance/[id]/en-cours', params: { id: session.id } })}
        />
      }
    >
      <View style={styles.titleBlock}>
        <Text variant="label" tone="ember" numberOfLines={1}>
          {muscleDots(session.muscles)}
        </Text>
        <Text variant="h1" accessibilityRole="header" style={styles.title}>
          {session.title}
        </Text>
        <View style={styles.meta}>
          <MetaRow minutes={session.durationMin} exercises={session.exercises.length} kcal={session.kcal} />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Playlist de la séance, ${musicSummary(music)}`}
        onPress={() => router.push({ pathname: '/musique', params: { sessionId: session.id } })}
        style={({ pressed }) => [styles.music, pressed && styles.pressed]}
      >
        <Image source={coverImages.pushday} style={styles.cover} contentFit="cover" />
        <View style={styles.musicText}>
          <Text variant="bodySemi">Playlist de la séance</Text>
          <Text variant="caption" tone="subtle" numberOfLines={1}>
            {musicSummary(music)}
          </Text>
        </View>
        <Icon name="chevron" size={20} color={colors.textSubtle} />
      </Pressable>

      <View style={styles.section}>
        <SectionTitle title="Exercices" right={setsSummary(session.exercises)} />
      </View>
      <Card radiusSize="card" style={styles.list}>
        {session.exercises.map((planned, index) => {
          const def = getExercise(planned.exerciseId);
          return (
            <View key={`${planned.exerciseId}-${index}`}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <View style={styles.row}>
                <ExerciseThumb exerciseId={def.id} size={60} radius={17} />
                <View style={styles.rowText}>
                  <Text variant="rowTitle" numberOfLines={1}>
                    {def.name}
                  </Text>
                  <Text variant="meta" tone="subtle">
                    {formatTarget(def.unit, planned.target)}
                  </Text>
                </View>
                <Text variant="captionSemi" tone="ember">
                  {MUSCLE_LABEL[def.muscles[0]]}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleBlock: { marginTop: 14 },
  title: { marginTop: 4 },
  meta: { marginTop: 8 },
  music: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  cover: { width: 48, height: 48, borderRadius: 13, borderCurve: 'continuous', backgroundColor: colors.surfaceRaised },
  musicText: { flex: 1, minWidth: 0, gap: 1 },
  section: { marginTop: 20 },
  list: { marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4, paddingLeft: 4, paddingRight: 16 },
  rowText: { flex: 1, minWidth: 0, gap: 1 },
  separator: { height: 1, marginLeft: 78, marginRight: 16, backgroundColor: colors.border },
});
