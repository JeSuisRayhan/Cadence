import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { thumbImages, type ExerciseImageKey } from '../../assets/images';
import { Button, Icon, Screen, Segmented, StepHeader, Text } from '../../components';
import { WEEKDAYS, WEEKDAY_LONG } from '../../domain/labels';
import type { Weekday } from '../../domain/types';
import { useDraft } from '../../store/draft';
import { colors } from '../../theme';
import { Image } from 'expo-image';

const COUNTS = [2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }));

/** Vignettes illustratives, attribuées dans l'ordre des jours choisis. */
const RANK_THUMBS: readonly ExerciseImageKey[] = ['pompes', 'rowing', 'squat', 'pullup', 'militaire', 'dips'];

export default function RhythmScreen() {
  const router = useRouter();
  const perWeek = useDraft((s) => s.perWeek);
  const weekdays = useDraft((s) => s.weekdays);
  const setPerWeek = useDraft((s) => s.setPerWeek);
  const toggleWeekday = useDraft((s) => s.toggleWeekday);

  const sorted = [...weekdays].sort((a, b) => a - b);
  const missing = perWeek - weekdays.length;
  const ready = missing === 0;

  return (
    <Screen
      scroll
      header={<StepHeader step={1} onBack={() => router.back()} />}
      footer={
        <Button
          label={ready ? 'Continuer' : `Choisis encore ${missing} ${missing > 1 ? 'jours' : 'jour'}`}
          disabled={!ready}
          onPress={() => router.push('/creation/niveau')}
        />
      }
    >
      <Text variant="h1" style={styles.title} accessibilityRole="header">
        Combien de séances par semaine ?
      </Text>

      <View style={styles.section}>
        <Text variant="h3" accessibilityRole="header">
          Séances par semaine
        </Text>
        <View style={styles.gap10}>
          <Segmented options={COUNTS} value={perWeek} onChange={setPerWeek} look="number" accessibilityLabel="Séances par semaine" />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text variant="h3" accessibilityRole="header">
            Quels jours ?
          </Text>
          <Text variant="metaSemi" tone={ready ? 'ember' : 'muted'}>
            {weekdays.length} sur {perWeek}
          </Text>
        </View>
        <View style={styles.days}>
          {WEEKDAYS.map((day) => (
            <DayRow
              key={day}
              day={day}
              rank={sorted.indexOf(day)}
              on={weekdays.includes(day)}
              onPress={() => toggleWeekday(day)}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

function DayRow({ day, rank, on, onPress }: { day: Weekday; rank: number; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={WEEKDAY_LONG[day]}
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={[styles.dayRow, on ? styles.dayRowOn : styles.dayRowOff]}
    >
      {on ? (
        <Image source={thumbImages[RANK_THUMBS[rank % RANK_THUMBS.length]]} contentFit="cover" style={styles.dayThumb} />
      ) : (
        <View style={[styles.dayThumb, styles.dayMoon]}>
          <Icon name="moon" size={18} color={colors.textFaint} />
        </View>
      )}
      <Text variant="rowTitle" tone={on ? 'text' : 'muted'} style={styles.dayName}>
        {WEEKDAY_LONG[day]}
      </Text>
      <Text variant="captionSemi" tone={on ? 'ember' : 'subtle'}>
        {on ? `Séance ${rank + 1}` : 'Repos'}
      </Text>
      <View style={[styles.check, on ? styles.checkOn : styles.checkOff]}>
        {on ? <Icon name="check" size={14} color={colors.onEmber} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 20, maxWidth: 320 },
  section: { marginTop: 22 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  gap10: { marginTop: 10 },
  days: { marginTop: 10, gap: 6 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderCurve: 'continuous',
  },
  dayRowOn: { backgroundColor: colors.surfaceWarm, borderColor: colors.emberLine },
  dayRowOff: { backgroundColor: colors.surface, borderColor: colors.border },
  dayThumb: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bg },
  dayMoon: { alignItems: 'center', justifyContent: 'center' },
  dayName: { flex: 1 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.ember },
  checkOff: { borderWidth: 1.5, borderColor: colors.outlineStrong },
});
