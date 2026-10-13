import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { formatKcal, formatMinutes, plural } from '../domain/format';
import { Icon, type IconName } from './Icon';
import { Text, type Tone } from './Text';

export interface MetaRowProps {
  minutes: number;
  exercises: number;
  kcal: number;
  tone?: Tone;
}

const COLORS: Partial<Record<Tone, string>> = { soft: colors.textSoft, muted: colors.textMuted };

/** Durée, nombre d'exercices et calories d'une séance. */
export function MetaRow({ minutes, exercises, kcal, tone = 'muted' }: MetaRowProps) {
  const color = COLORS[tone] ?? colors.textMuted;
  const items: { icon: IconName; label: string }[] = [
    { icon: 'clock', label: formatMinutes(minutes) },
    { icon: 'dumbbell', label: plural(exercises, 'exercice', 'exercices') },
    { icon: 'flame', label: formatKcal(kcal) },
  ];
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.icon} style={styles.item}>
          <Icon name={item.icon} size={16} color={color} />
          <Text variant="meta" tone={tone}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
