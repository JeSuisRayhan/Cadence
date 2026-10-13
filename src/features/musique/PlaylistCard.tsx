import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { coverImages } from '../../assets/images';
import { Button, Card, Icon, Text } from '../../components';
import { formatTrackTime, plural } from '../../domain/format';
import type { PreviewState } from '../../hooks/usePlaylistPreview';
import { genreById } from '../../music/genres';
import type { Track } from '../../music/types';
import { colors } from '../../theme';
import { EnergyCurve } from './EnergyCurve';

const VISIBLE = 4;

const SOURCE_LABEL: Record<Track['source'], string> = { jamendo: 'Jamendo', audius: 'Audius', local: 'Mes fichiers' };

export interface PlaylistCardProps {
  title: string;
  state: Exclude<PreviewState, { status: 'off' }>;
  onRefresh: () => void;
}

/** La playlist composée pour la séance : sa courbe d'intensité et ses titres. */
export function PlaylistCard({ title, state, onRefresh }: PlaylistCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (state.status === 'ready') {
    const { tracks } = state.playlist;
    const minutes = Math.round(tracks.reduce((sum, t) => sum + t.durationSec, 0) / 60);
    const shown = expanded ? tracks : tracks.slice(0, VISIBLE);
    const hidden = tracks.length - shown.length;
    return (
      <Card radiusSize="panel" style={styles.card}>
        <Header title={title} sub={`${plural(tracks.length, 'titre', 'titres')} · ${minutes} min`}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Composer une autre playlist"
            onPress={onRefresh}
            style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}
          >
            <Icon name="refresh" size={20} color={colors.text} strokeWidth={1.9} />
          </Pressable>
        </Header>
        <View style={styles.curve}>
          <EnergyCurve />
        </View>
        <View style={styles.tracks}>
          {shown.map((track) => (
            <TrackRow key={track.id} track={track} />
          ))}
        </View>
        {hidden > 0 || expanded ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((v) => !v)}
            style={styles.more}
          >
            <Text variant="metaSemi" tone="muted">
              {expanded ? 'Réduire la liste' : `Voir les ${hidden} autres titres`}
            </Text>
          </Pressable>
        ) : null}
      </Card>
    );
  }

  if (state.status === 'loading') {
    return (
      <Card radiusSize="panel" style={styles.card}>
        <Header title={title} sub="Composition en cours…">
          <View style={styles.refresh}>
            <ActivityIndicator size="small" color={colors.ember} />
          </View>
        </Header>
        <View style={styles.curve}>
          <EnergyCurve />
        </View>
        <Text variant="caption" tone="subtle" style={styles.note}>
          Je choisis les titres qui suivent l’intensité de ta séance.
        </Text>
      </Card>
    );
  }

  return (
    <Card radiusSize="panel" style={styles.card}>
      <Header title={title} sub="Playlist indisponible" />
      <Text variant="body" tone="muted" style={styles.note}>
        {state.message}
      </Text>
      <View style={styles.actions}>
        <Button label="Réessayer" size="md" variant="outline" onPress={onRefresh} style={styles.grow} />
      </View>
    </Card>
  );
}

function Header({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Image source={coverImages.pushday} style={styles.cover} contentFit="cover" />
      <View style={styles.headerText}>
        <Text variant="rowTitle" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" tone="subtle">
          {sub}
        </Text>
      </View>
      {children}
    </View>
  );
}

function TrackRow({ track }: { track: Track }) {
  const fallback = coverImages[track.genre ? genreById(track.genre).cover : 'pushday'];
  return (
    <View style={styles.track}>
      <Image
        source={track.artwork ? { uri: track.artwork } : fallback}
        placeholder={fallback}
        contentFit="cover"
        transition={150}
        style={styles.trackCover}
      />
      <View style={styles.trackText}>
        <Text variant="bodySemi" numberOfLines={1}>
          {track.title}
        </Text>
        <Text variant="caption" tone="subtle" numberOfLines={1}>
          {`${track.artist} · ${SOURCE_LABEL[track.source]}`}
        </Text>
      </View>
      <Text variant="caption" tone="subtle" style={styles.time}>
        {formatTrackTime(track.durationSec)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cover: { width: 52, height: 52, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.surfaceRaised },
  headerText: { flex: 1, minWidth: 0 },
  refresh: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: { opacity: 0.8 },
  curve: { marginTop: 12 },
  tracks: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  track: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52 },
  trackCover: { width: 38, height: 38, borderRadius: 10, borderCurve: 'continuous', backgroundColor: colors.surfaceRaised },
  trackText: { flex: 1, minWidth: 0 },
  time: { fontVariant: ['tabular-nums'] },
  more: { height: 44, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  note: { marginTop: 10 },
  actions: { marginTop: 14, flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
});
