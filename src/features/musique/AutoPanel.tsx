import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SectionTitle, Text } from '../../components';
import { usePlaylistPreview, type PreviewTarget } from '../../hooks/usePlaylistPreview';
import { useAppStore } from '../../store';
import { EngineChoice } from './EngineChoice';
import { GenreTiles } from './GenreTiles';
import { JamendoKeyCard } from './JamendoKeyCard';
import { PlaylistCard } from './PlaylistCard';

export interface AutoPanelProps {
  target: PreviewTarget & { title: string };
}

/** Mode automatique : les goûts, où jouer la playlist, et la playlist composée pour la séance. */
export function AutoPanel({ target }: AutoPanelProps) {
  const music = useAppStore((s) => s.music);
  const setMusic = useAppStore((s) => s.setMusic);
  const { state, refresh } = usePlaylistPreview(target, music);
  const [editingKey, setEditingKey] = useState(false);

  const saveKey = (key: string) => {
    setMusic({ jamendoClientId: key });
    setEditingKey(false);
  };

  return (
    <View>
      <View style={styles.section}>
        <SectionTitle title="Tes goûts" />
        <View style={styles.body}>
          <GenreTiles value={music.genres} onChange={(genres) => setMusic({ genres })} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Lecture" />
        <View style={styles.body}>
          <EngineChoice
            engine={music.autoEngine}
            app={music.externalApp}
            genres={music.genres}
            onEngine={(autoEngine) => setMusic({ autoEngine })}
            onApp={(externalApp) => setMusic({ externalApp })}
          />
        </View>
      </View>

      {music.autoEngine === 'inapp' ? (
        <View style={styles.section}>
          <SectionTitle title="Playlist de la séance" />
          <View style={styles.body}>
            {editingKey || state.status === 'no-key' ? (
              <JamendoKeyCard
                current={music.jamendoClientId}
                onSave={saveKey}
                onCancel={state.status === 'no-key' ? undefined : () => setEditingKey(false)}
              />
            ) : state.status === 'ready' || state.status === 'loading' || state.status === 'error' ? (
              <PlaylistCard title={target.title} state={state} onRefresh={refresh} onEditKey={() => setEditingKey(true)} />
            ) : null}
            <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://www.jamendo.com')} style={styles.credit}>
              <Text variant="caption" tone="subtle">
                Musique libre du catalogue Jamendo, pour un usage non commercial. Les artistes sont crédités dans la liste.{' '}
                <Text variant="captionSemi" tone="muted">
                  jamendo.com
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  body: { marginTop: 10 },
  credit: { marginTop: 12, paddingHorizontal: 4 },
});
