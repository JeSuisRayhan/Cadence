import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { coverImages } from '../../assets/images';
import { Card, Icon, ReminderCard, Screen, SectionTitle, Text } from '../../components';
import { useReminderControls } from '../../hooks/useReminderControls';
import { musicSummary } from '../../music/session';
import { useAppStore } from '../../store';
import { colors } from '../../theme';

export default function SettingsScreen() {
  const router = useRouter();
  const controls = useReminderControls();
  const music = useAppStore((s) => s.music);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen scroll tabs>
      <Text variant="title" accessibilityRole="header">
        Réglages
      </Text>

      <View style={styles.section}>
        <SectionTitle title="Rappel" />
        <View style={styles.body}>
          <ReminderCard
            enabled={controls.enabled}
            minutes={controls.minutes}
            blocked={controls.blocked}
            onToggle={(next) => void controls.toggle(next)}
            onShift={controls.shift}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Musique" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Musique de séance, ${musicSummary(music)}`}
          onPress={() => router.push('/musique')}
          style={({ pressed }) => [styles.music, pressed && styles.pressed]}
        >
          <Image source={coverImages.pushday} style={styles.cover} contentFit="cover" />
          <View style={styles.musicText}>
            <Text variant="bodySemi">Musique de séance</Text>
            <Text variant="caption" tone="subtle" numberOfLines={1}>
              {musicSummary(music)}
            </Text>
          </View>
          <Icon name="chevron" size={20} color={colors.textSubtle} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionTitle title="À propos" />
        <Card radiusSize="card" style={styles.about}>
          <Text variant="bodySemi">Cadence {version}</Text>
          <Text variant="caption" tone="subtle" style={styles.aboutLine}>
            Tes programmes et ton historique restent sur ce téléphone.
          </Text>
          <Text variant="caption" tone="subtle" style={styles.aboutLink}>
            Les playlists automatiques puisent dans{' '}
            <Text variant="captionSemi" tone="muted" accessibilityRole="link" onPress={() => void Linking.openURL('https://audius.co')}>
              Audius
            </Text>{' '}
            (artistes indépendants) et{' '}
            <Text variant="captionSemi" tone="muted" accessibilityRole="link" onPress={() => void Linking.openURL('https://www.jamendo.com')}>
              Jamendo
            </Text>{' '}
            (musique libre, usage non commercial).
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  body: { marginTop: 10 },
  music: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  cover: { width: 48, height: 48, borderRadius: 13, borderCurve: 'continuous', backgroundColor: colors.surfaceRaised },
  musicText: { flex: 1, minWidth: 0, gap: 1 },
  about: { marginTop: 10, padding: 16 },
  aboutLine: { marginTop: 2 },
  aboutLink: { marginTop: 10 },
});
