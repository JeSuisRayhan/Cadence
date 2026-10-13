import { StyleSheet, View } from 'react-native';
import { Card, Icon, Switch, Text } from '../../components';
import { useAppStore } from '../../store';
import { colors } from '../../theme';

/** Lancer la musique dès le début de la séance, ou la démarrer à la main. */
export function AutoStartRow() {
  const autoStart = useAppStore((s) => s.music.autoStart);
  const setMusic = useAppStore((s) => s.setMusic);
  return (
    <Card radiusSize="card">
      <View style={styles.row}>
        <View style={styles.badge}>
          <Icon name="play" size={18} color={colors.ember} />
        </View>
        <View style={styles.grow}>
          <Text variant="bodySemi">Lancer au début de la séance</Text>
          <Text variant="caption" tone="subtle">
            {autoStart ? 'La musique démarre avec ta séance' : 'Tu la lances toi-même depuis la séance'}
          </Text>
        </View>
        <Switch value={autoStart} onValueChange={(value) => setMusic({ autoStart: value })} label="Lancer la musique au début de la séance" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 8, paddingLeft: 14, paddingRight: 8 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
  },
  grow: { flex: 1 },
});
