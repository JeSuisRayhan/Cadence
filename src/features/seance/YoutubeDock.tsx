import { memo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, Text } from '../../components';
import { openExternalMusic, stopYoutube } from '../../music/player';
import type { YoutubeLink } from '../../music/youtube';
import { MIN_PLAYER_SIDE, youtubeFailureText } from '../../music/youtubeEmbed';
import { colors, screenPadding } from '../../theme';
import { YoutubePlayerView } from './YoutubePlayerView';

/** À partir de cette largeur d'écran, le lecteur et ses boutons se placent côte à côte. */
const WIDE_FROM = 640;
/** Lecteur 16/9 de 200 px de haut : le minimum que YouTube accepte, pour laisser la place à la séance. */
const WIDE_PLAYER = { width: 356, height: 200 } as const;
const PADDING = 8;

export interface YoutubeDockProps {
  link: YoutubeLink;
}

/**
 * La playlist YouTube de la séance, en bas de l'écran : le lecteur officiel reste visible en entier (règle de YouTube)
 * et le reste de l'écran sert comme d'habitude, pour changer d'exercice ou valider une série.
 * Monté une seule fois par la séance, au-dessus des écrans « exercice » et « repos » : la lecture ne redémarre pas quand ils changent.
 */
export const YoutubeDock = memo(function YoutubeDock({ link }: YoutubeDockProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [failure, setFailure] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const wide = width >= WIDE_FROM;
  const playerWidth = wide ? WIDE_PLAYER.width : width - 2 * screenPadding - 2 * PADDING;
  const playerHeight = wide ? WIDE_PLAYER.height : Math.max(MIN_PLAYER_SIDE, Math.round((playerWidth * 9) / 16));
  const size = { width: playerWidth, height: playerHeight };

  const retry = () => {
    setFailure(null);
    setAttempt((n) => n + 1);
  };

  return (
    <View style={[styles.dock, wide ? styles.dockWide : null, { marginBottom: Math.max(insets.bottom, 12) + 12 }]}>
      <View style={[styles.player, size]}>
        {failure ? (
          <View style={styles.failure}>
            <Icon name="info" size={24} color={colors.ember} />
            <Text variant="meta" tone="soft" align="center" accessibilityLiveRegion="polite">
              {youtubeFailureText(failure)}
            </Text>
            <Button size="md" variant="outline" label="Réessayer" onPress={retry} />
          </View>
        ) : (
          <YoutubePlayerView key={attempt} link={link} onFailed={setFailure} />
        )}
      </View>

      <View style={wide ? styles.sideWide : styles.sideNarrow}>
        <View style={styles.texts}>
          <Text variant="bodySemi" numberOfLines={1}>
            Playlist YouTube
          </Text>
          <Text variant="caption" tone="subtle" numberOfLines={3}>
            {failure ? 'Tu peux l’ouvrir dans l’application YouTube.' : 'Pause automatique si tu quittes l’appli ou verrouilles l’écran.'}
          </Text>
        </View>
        <View style={styles.actions}>
          <IconButton icon="external" label="Ouvrir dans YouTube" onPress={() => void openExternalMusic('YouTube', link.url)} />
          <IconButton icon="close" label="Arrêter la musique YouTube" onPress={stopYoutube} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  dock: {
    marginHorizontal: screenPadding,
    gap: 10,
    padding: PADDING,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dockWide: { flexDirection: 'row', gap: 14 },
  player: { overflow: 'hidden', borderRadius: 14, borderCurve: 'continuous', backgroundColor: '#000' },
  failure: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16 },
  sideWide: { flex: 1, minWidth: 0, justifyContent: 'space-between', paddingVertical: 4, paddingRight: 4 },
  sideNarrow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 4 },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  actions: { flexDirection: 'row', gap: 10 },
});
