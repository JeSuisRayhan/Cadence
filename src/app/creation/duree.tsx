import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Icon, IconButton, Ring, Screen, StepHeader, Text } from '../../components';
import { formatKcal } from '../../domain/format';
import { previewSession } from '../../domain/generator';
import { DURATION_MAX, DURATION_MIN, DURATION_STEP, useDraft } from '../../store/draft';
import { colors } from '../../theme';

const PRESETS = [30, 45, 60, 75, 90];

export default function DurationScreen() {
  const router = useRouter();
  const muscles = useDraft((s) => s.muscles);
  const level = useDraft((s) => s.level);
  const place = useDraft((s) => s.place);
  const weekdays = useDraft((s) => s.weekdays);
  const durationMin = useDraft((s) => s.durationMin);
  const setDuration = useDraft((s) => s.setDuration);

  const preview = useMemo(
    () => previewSession({ muscles, level, place, durationMin, weekdays: [...weekdays].sort((a, b) => a - b) }),
    [muscles, level, place, durationMin, weekdays],
  );

  return (
    <Screen
      scroll
      header={<StepHeader step={4} onBack={() => router.back()} />}
      footer={<Button label="Créer mon programme" onPress={() => router.push('/creation/pret')} />}
    >
      <Text variant="h1" style={styles.title} accessibilityRole="header">
        Combien de temps par séance ?
      </Text>

      <View style={styles.dial}>
        <IconButton
          icon="minus"
          label="Réduire de 5 minutes"
          size={56}
          iconSize={24}
          strokeWidth={2}
          disabled={durationMin <= DURATION_MIN}
          onPress={() => setDuration(durationMin - DURATION_STEP)}
        />
        <Ring
          progress={durationMin / DURATION_MAX}
          color={colors.ember}
          glow
          accessibilityLabel={`${durationMin} minutes par séance`}
        >
          <Text variant="numXL">{durationMin}</Text>
          <Text variant="rowTitle" tone="muted" style={styles.unit}>
            minutes
          </Text>
        </Ring>
        <IconButton
          icon="plus"
          label="Augmenter de 5 minutes"
          size={56}
          iconSize={24}
          strokeWidth={2}
          disabled={durationMin >= DURATION_MAX}
          onPress={() => setDuration(durationMin + DURATION_STEP)}
        />
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel="Durées proposées" style={styles.presets}>
        {PRESETS.map((value) => {
          const selected = value === durationMin;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityLabel={`${value} minutes`}
              accessibilityState={{ selected }}
              onPress={() => setDuration(value)}
              style={[styles.preset, selected ? styles.presetOn : styles.presetOff]}
            >
              <Text variant="bodySemi" tone={selected ? 'onEmber' : 'text'}>
                {value} min
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card radiusSize="card" style={styles.stats}>
        <View style={styles.stat}>
          <View style={styles.statLabel}>
            <Icon name="dumbbell" size={16} color={colors.textMuted} />
            <Text variant="captionMedium" tone="muted">
              Exercices
            </Text>
          </View>
          <Text variant="statSm">{preview.exercises}</Text>
        </View>
        <View style={[styles.stat, styles.statDivider]}>
          <View style={styles.statLabel}>
            <Icon name="flame" size={16} color={colors.textMuted} />
            <Text variant="captionMedium" tone="muted">
              Calories estimées
            </Text>
          </View>
          <Text variant="statSm" accessibilityLabel={formatKcal(preview.kcal)}>
            ≈ {preview.kcal}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 20, maxWidth: 320 },
  dial: { marginTop: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unit: { marginTop: 2 },
  presets: { marginTop: 27, flexDirection: 'row', gap: 8 },
  preset: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  presetOn: { backgroundColor: colors.ember, borderColor: colors.ember },
  presetOff: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  stats: { marginTop: 25, flexDirection: 'row' },
  stat: { flex: 1, gap: 2, paddingVertical: 16, paddingHorizontal: 18 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
