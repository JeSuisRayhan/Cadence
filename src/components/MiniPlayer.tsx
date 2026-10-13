import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { genreById } from '../music/genres';
import { nextTrack, openExternalMusic, selectCurrentTrack, togglePlayback, usePlayer } from '../music/player';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface MiniPlayerProps {
  /** lancer la musique de la séance quand rien ne joue */
  onStart: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Lecteur compact de la séance : titre en cours, lecture/pause, titre suivant. */
export function MiniPlayer({ onStart, style }: MiniPlayerProps) {
  const status = usePlayer((s) => s.status);
  const track = usePlayer(selectCurrentTrack);
  const external = usePlayer((s) => s.external);
  const youtube = usePlayer((s) => s.youtube);
  const message = usePlayer((s) => s.message);
  const source = usePlayer((s) => s.source);

  // la playlist YouTube a son propre lecteur, en bas de l'écran de séance
  if (youtube) return null;

  // musique ouverte dans une autre application : on propose de la rouvrir
  if (external) {
    return (
      <Shell style={style}>
        <Cover icon="external" />
        <Texts title={`Musique dans ${external.label}`} sub={message ?? 'Touche pour rouvrir l’application'} />
        <RoundButton
          icon="external"
          label={`Rouvrir ${external.label}`}
          onPress={() => void openExternalMusic(external.label, external.url)}
          look="quiet"
        />
      </Shell>
    );
  }

  if (track) {
    const genre = track.genre ? ` · ${genreById(track.genre).label}` : '';
    const loading = status === 'loading';
    return (
      <Shell style={style}>
        <Cover artwork={track.artwork} icon="music" />
        <Texts title={track.title} sub={message ?? `${track.artist}${genre}`} />
        <RoundButton
          icon={status === 'playing' ? 'pause' : 'play'}
          label={status === 'playing' ? 'Mettre la musique en pause' : 'Reprendre la musique'}
          onPress={togglePlayback}
          busy={loading}
        />
        <RoundButton icon="next" label="Morceau suivant" onPress={nextTrack} look="quiet" />
      </Shell>
    );
  }

  if (status === 'loading') {
    return (
      <Shell style={style}>
        <Cover icon="sparkle" />
        <Texts title="Je compose ta playlist…" sub={source ?? 'Quelques secondes'} />
        <RoundButton icon="play" label="Playlist en préparation" busy />
      </Shell>
    );
  }

  return (
    <Shell style={style}>
      <Cover icon={message ? 'info' : 'music'} />
      <Texts title="Musique" sub={message ?? 'Touche lecture pour lancer ta playlist'} lines={2} />
      <RoundButton icon="play" label="Lancer la musique" onPress={onStart} />
    </Shell>
  );
}

function Shell({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.shell, style]}>{children}</View>;
}

function Cover({ artwork, icon }: { artwork?: string; icon: IconName }) {
  if (artwork) {
    return <Image source={{ uri: artwork }} style={styles.cover} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={[styles.cover, styles.coverIcon]}>
      <Icon name={icon} size={22} color={colors.ember} strokeWidth={1.9} />
    </View>
  );
}

function Texts({ title, sub, lines = 1 }: { title: string; sub: string; lines?: number }) {
  return (
    <View style={styles.texts}>
      <Text variant="bodySemi" numberOfLines={1}>
        {title}
      </Text>
      <Text variant="caption" tone="subtle" numberOfLines={lines}>
        {sub}
      </Text>
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
  look = 'solid',
  busy = false,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  look?: 'solid' | 'quiet';
  busy?: boolean;
}) {
  const solid = look === 'solid';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.round, solid && styles.roundSolid, pressed && styles.pressed]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={solid ? colors.onEmber : colors.textSoft} />
      ) : (
        <Icon name={icon} size={solid ? 20 : 22} color={solid ? colors.onEmber : colors.textSoft} strokeWidth={1.9} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 6,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: { width: 44, height: 44, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surfaceRaised },
  coverIcon: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.emberTint },
  texts: { flex: 1, minWidth: 0 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  roundSolid: { backgroundColor: colors.text },
  pressed: { opacity: 0.8 },
});
