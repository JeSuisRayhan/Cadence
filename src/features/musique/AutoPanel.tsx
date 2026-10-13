import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, SectionTitle, Text } from '../../components';
import { usePlaylistPreview, type PreviewTarget } from '../../hooks/usePlaylistPreview';
import { useAppStore } from '../../store';
import { EngineChoice } from './EngineChoice';
import { GenreTiles } from './GenreTiles';
import { JamendoKeyCard } from './JamendoKeyCard';
import { PlaylistCard } from './PlaylistCard';

export interface AutoPanelProps {
  target: PreviewTarget & { title: string };
}

const open = (url: string) => () => void Linking.openURL(url);

/** Mode automatique : les goûts, où jouer la playlist, et la playlist composée pour la séance. */
export function AutoPanel({ target }: AutoPanelProps) {
  const music = useAppStore((s) => s.music);
  const setMusic = useAppStore((s) => s.setMusic);
  const { state, refresh } = usePlaylistPreview(target, music);
  const [editingKey, setEditingKey] = useState(false);
  const hasKey = music.jamendoClientId.trim().length > 0;

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
            {editingKey ? (
              <JamendoKeyCard current={music.jamendoClientId} onSave={saveKey} onCancel={() => setEditingKey(false)} />
            ) : (
              <>
                {state.status !== 'off' ? <PlaylistCard title={target.title} state={state} onRefresh={refresh} /> : null}
                <Button
                  label={hasKey ? 'Modifier ma clé Jamendo' : 'Ajouter Jamendo (facultatif)'}
                  size="md"
                  variant="quiet"
                  onPress={() => setEditingKey(true)}
                  style={styles.keyButton}
                />
              </>
            )}
            <Text variant="caption" tone="subtle" style={styles.credit}>
              Titres d’artistes indépendants sur{' '}
              <Text variant="captionSemi" tone="muted" accessibilityRole="link" onPress={open('https://audius.co')}>
                Audius
              </Text>{' '}
              et musique libre de{' '}
              <Text variant="captionSemi" tone="muted" accessibilityRole="link" onPress={open('https://www.jamendo.com')}>
                Jamendo
              </Text>{' '}
              (usage non commercial). Les artistes sont crédités dans la liste.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  body: { marginTop: 10 },
  keyButton: { marginTop: 8 },
  credit: { marginTop: 12, paddingHorizontal: 4 },
});
