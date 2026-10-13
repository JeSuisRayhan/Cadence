import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BodyMap, Button, Card, IconButton, ReminderCard, Screen, Text } from '../../components';
import { plural } from '../../domain/format';
import { createProgram } from '../../domain/generator';
import { LEVEL_LABEL, MUSCLES, MUSCLE_LABEL, placeLabel, WEEKDAY_SHORT } from '../../domain/labels';
import { useReminderControls } from '../../hooks/useReminderControls';
import { ensureNotificationPermission } from '../../notifications';
import { useAppStore } from '../../store';
import { useDraft } from '../../store/draft';
import { colors } from '../../theme';

export default function ReadyScreen() {
  const router = useRouter();
  const addProgram = useAppStore((s) => s.addProgram);
  const setReminder = useAppStore((s) => s.setReminder);
  const reminder = useReminderControls();
  const [saving, setSaving] = useState(false);

  const draft = useDraft();
  const weekdays = [...draft.weekdays].sort((a, b) => a - b);
  const muscles = MUSCLES.filter((m) => draft.muscles.includes(m));

  const facts = [
    { label: 'Rythme', value: weekdays.map((d) => WEEKDAY_SHORT[d]).join(' · ') },
    { label: 'Durée', value: `${draft.durationMin} min` },
    { label: 'Niveau', value: LEVEL_LABEL[draft.level] },
    { label: 'Lieu', value: placeLabel(draft.place, draft.noWeights) },
  ];

  const confirm = async () => {
    if (saving) return;
    setSaving(true);
    // le programme n'est créé qu'ici : revenir en arrière depuis cet écran ne laisse rien derrière soi
    if (reminder.enabled && !(await ensureNotificationPermission())) setReminder({ enabled: false });
    addProgram(
      createProgram({
        muscles,
        level: draft.level,
        place: draft.place,
        noWeights: draft.noWeights,
        durationMin: draft.durationMin,
        weekdays,
      }),
    );
    useDraft.getState().reset();
    router.replace('/');
  };

  return (
    <Screen
      scroll
      header={<IconButton icon="back" label="Retour" onPress={() => router.back()} />}
      footer={<Button label="Voir mon programme" disabled={saving} onPress={() => void confirm()} />}
    >
      <Text variant="h1" style={styles.title} accessibilityRole="header">
        Ton programme est prêt
      </Text>
      <Text variant="body" tone="muted" style={styles.subtitle}>
        {plural(weekdays.length, 'séance', 'séances')} par semaine, dès aujourd’hui.
      </Text>

      <Card radiusSize="hero" style={styles.body}>
        <BodyMap muscles={muscles} width={210} />
        <View style={styles.muscles}>
          <Text variant="label" tone="ember" style={styles.musclesLabel}>
            Muscles
          </Text>
          {muscles.map((m) => (
            <View key={m} style={styles.muscle}>
              <View style={styles.dot} />
              <Text variant="bodySemi">{MUSCLE_LABEL[m]}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.facts}>
        {facts.map((fact) => (
          <Card key={fact.label} radiusSize="xl" style={styles.fact}>
            <Text variant="micro" tone="subtle">
              {fact.label}
            </Text>
            <Text variant="rowTitle" numberOfLines={1}>
              {fact.value}
            </Text>
          </Card>
        ))}
      </View>

      <View style={styles.reminder}>
        <ReminderCard
          enabled={reminder.enabled}
          minutes={reminder.minutes}
          blocked={reminder.blocked}
          onToggle={(next) => void reminder.toggle(next)}
          onShift={reminder.shift}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 14, maxWidth: 260 },
  subtitle: { marginTop: 4 },
  body: {
    marginTop: 18,
    minHeight: 226,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 8,
  },
  muscles: { flex: 1, gap: 7 },
  musclesLabel: { marginBottom: 2 },
  muscle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ember },
  facts: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fact: { width: '48.6%', paddingVertical: 11, paddingHorizontal: 16, gap: 1 },
  reminder: { marginTop: 12 },
});
