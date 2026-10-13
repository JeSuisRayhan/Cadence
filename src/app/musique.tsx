import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Screen, Segmented, Text } from '../components';
import { AutoPanel } from '../features/musique/AutoPanel';
import { AutoStartRow } from '../features/musique/AutoStartRow';
import { ManualPanel } from '../features/musique/ManualPanel';
import type { MusicMode } from '../music/types';
import { findSession, useAppStore } from '../store';
import { nextOccurrence } from '../domain/week';
import { useFocusNow } from '../hooks/useFocusNow';

/** Durée et titre de la séance de démonstration, tant qu'aucun programme n'existe. */
const SAMPLE = { id: 'apercu', title: 'Séance type', durationMin: 45 } as const;

export default function MusicScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const mode = useAppStore((s) => s.music.mode);
  const setMusic = useAppStore((s) => s.setMusic);
  const programs = useAppStore((s) => s.programs);
  const activeProgramId = useAppStore((s) => s.activeProgramId);
  const history = useAppStore((s) => s.history);
  const now = useFocusNow();

  // la playlist montrée est celle de la séance ouverte, sinon de la prochaine séance
  const requested = sessionId ? findSession(programs, sessionId) : null;
  const active = programs.find((p) => p.id === activeProgramId) ?? null;
  const upcoming = active ? nextOccurrence(active, history, now) : null;
  const session = requested?.session ?? upcoming?.session ?? active?.sessions[0] ?? null;
  const target = session ? { id: session.id, title: session.title, durationMin: session.durationMin } : SAMPLE;

  return (
    <Screen
      scroll
      header={<IconButton icon="back" label="Retour" onPress={() => router.back()} />}
      footer={<Button label="Enregistrer" onPress={() => router.back()} />}
    >
      <Text variant="h1" accessibilityRole="header" style={styles.title}>
        Musique de séance
      </Text>
      <View style={styles.tabs}>
        <Segmented<MusicMode>
          look="tab"
          accessibilityLabel="Mode de la playlist"
          value={mode}
          onChange={(next) => setMusic({ mode: next })}
          options={[
            { value: 'auto', label: 'Automatique', icon: 'sparkle' },
            { value: 'manual', label: 'Manuel', icon: 'folder' },
          ]}
        />
      </View>

      {mode === 'auto' ? <AutoPanel target={target} /> : <ManualPanel />}

      <View style={styles.start}>
        <AutoStartRow />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 14 },
  tabs: { marginTop: 18 },
  start: { marginTop: 22 },
});
