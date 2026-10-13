import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { formatClock } from '../domain/format';
import { REMINDER_MAX, REMINDER_MIN } from '../hooks/useReminderControls';
import { Card } from './Card';
import { Icon } from './Icon';
import { Switch } from './Switch';
import { Text } from './Text';

export interface ReminderCardProps {
  enabled: boolean;
  minutes: number;
  /** le téléphone refuse les notifications */
  blocked?: boolean;
  onToggle: (next: boolean) => void;
  onShift: (direction: -1 | 1) => void;
}

/** Interrupteur du rappel et choix de l'heure, par pas de 30 minutes. */
export function ReminderCard({ enabled, minutes, blocked = false, onToggle, onShift }: ReminderCardProps) {
  const time = formatClock(minutes);
  return (
    <View>
      <Card radiusSize="card">
        <View style={styles.row}>
          <View style={styles.badge}>
            <Icon name="bell" size={20} color={colors.ember} />
          </View>
          <View style={styles.grow}>
            <Text variant="bodySemi">Rappel de séance</Text>
            <Text variant="caption" tone="subtle">
              {enabled ? `Les jours de séance, à ${time}` : 'Désactivé'}
            </Text>
          </View>
          <Switch value={enabled} onValueChange={onToggle} label="Rappel de séance" />
        </View>
        <View style={[styles.row, styles.timeRow, !enabled && styles.faded]} pointerEvents={enabled ? 'auto' : 'none'}>
          <Text variant="bodyMedium" style={styles.timeLabel}>
            Heure du rappel
          </Text>
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rappel 30 minutes plus tôt"
              disabled={minutes <= REMINDER_MIN}
              onPress={() => onShift(-1)}
              style={[styles.step, minutes <= REMINDER_MIN && styles.faded]}
            >
              <Icon name="minus" size={20} color={colors.textSoft} strokeWidth={2} />
            </Pressable>
            <Text variant="numClock" style={styles.time}>
              {time}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rappel 30 minutes plus tard"
              disabled={minutes >= REMINDER_MAX}
              onPress={() => onShift(1)}
              style={[styles.step, minutes >= REMINDER_MAX && styles.faded]}
            >
              <Icon name="plus" size={20} color={colors.textSoft} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </Card>
      {blocked ? (
        <Pressable accessibilityRole="link" onPress={() => void Linking.openSettings()} style={styles.hint}>
          <Text variant="caption" tone="muted">
            Les notifications sont bloquées sur ce téléphone.{' '}
            <Text variant="captionSemi" tone="ember">
              Ouvrir les réglages
            </Text>
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 60, paddingLeft: 14, paddingRight: 8 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
  },
  grow: { flex: 1 },
  timeRow: { justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border },
  timeLabel: { color: '#C9C6C0' },
  faded: { opacity: 0.4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  step: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  time: { minWidth: 62, textAlign: 'center' },
  hint: { marginTop: 10, paddingHorizontal: 6 },
});
