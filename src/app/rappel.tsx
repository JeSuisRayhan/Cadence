import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Icon, IconButton, ReminderCard, Screen, Text } from '../components';
import { nextOccurrence } from '../domain/week';
import { useFocusNow } from '../hooks/useFocusNow';
import { useReminderControls } from '../hooks/useReminderControls';
import { reminderContent } from '../notifications/content';
import { useAppStore } from '../store';
import { colors } from '../theme';

export default function ReminderScreen() {
  const router = useRouter();
  const controls = useReminderControls();
  const now = useFocusNow();
  const program = useAppStore((s) => s.programs.find((p) => p.id === s.activeProgramId) ?? null);
  const history = useAppStore((s) => s.history);
  const musicReady = useAppStore((s) => s.music.mode === 'auto' || s.music.files.length > 0 || s.music.youtubeUrl !== null);

  const session = program ? (nextOccurrence(program, history, now)?.session ?? program.sessions[0] ?? null) : null;
  const content = session
    ? reminderContent(session, musicReady)
    : { title: 'C’est l’heure de ta séance', body: 'Crée un programme pour recevoir ton rappel les jours de séance.' };

  return (
    <Screen
      scroll
      header={<IconButton icon="close" label="Fermer" onPress={() => router.back()} />}
      footer={<Button label="Terminé" onPress={() => router.back()} />}
    >
      <Text variant="h1" accessibilityRole="header" style={styles.title}>
        Rappel de séance
      </Text>
      <Text variant="body" tone="muted" style={styles.lead}>
        Une notification les jours où une séance est prévue, à l’heure que tu choisis.
      </Text>

      <Card radiusSize="card" style={styles.preview} accessible accessibilityLabel={`Aperçu : ${content.title}. ${content.body}`}>
        <View style={styles.previewRow}>
          <View style={styles.appIcon}>
            <Icon name="dumbbell" size={24} color={colors.onEmber} strokeWidth={2} />
          </View>
          <View style={styles.previewText}>
            <View style={styles.previewHeader}>
              <Text variant="captionSemi" tone="muted" style={styles.appName}>
                CADENCE
              </Text>
              <Text variant="caption" tone="muted">
                maintenant
              </Text>
            </View>
            <Text variant="rowTitle" style={styles.previewTitle}>
              {content.title}
            </Text>
            <Text variant="body" tone="soft" style={styles.previewBody}>
              {content.body}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.controls}>
        <ReminderCard enabled={controls.enabled} minutes={controls.minutes} blocked={controls.blocked} onToggle={(next) => void controls.toggle(next)} onShift={controls.shift} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 14 },
  lead: { marginTop: 6 },
  preview: { marginTop: 22, padding: 14, backgroundColor: colors.surfaceRaised, borderColor: colors.borderSoft },
  previewRow: { flexDirection: 'row', gap: 12 },
  appIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ember },
  previewText: { flex: 1, minWidth: 0 },
  previewHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  appName: { letterSpacing: 1 },
  previewTitle: { marginTop: 2 },
  previewBody: { marginTop: 2, lineHeight: 21 },
  controls: { marginTop: 18 },
});
