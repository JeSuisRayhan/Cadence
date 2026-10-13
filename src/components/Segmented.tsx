import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
  icon?: IconName;
}

export interface SegmentedProps<T extends string | number> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `number` : grands chiffres (nombre de séances) ; `tab` : onglets avec icône (mode de playlist) */
  look?: 'number' | 'tab';
  accessibilityLabel: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  look = 'tab',
  accessibilityLabel,
}: SegmentedProps<T>) {
  const isNumber = look === 'number';
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.group, isNumber ? styles.groupNumber : styles.groupTab]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.item,
              isNumber ? styles.itemNumber : styles.itemTab,
              selected && { backgroundColor: colors.ember },
            ]}
          >
            {option.icon ? (
              <Icon name={option.icon} size={18} color={selected ? colors.onEmber : colors.textSoft} strokeWidth={1.9} />
            ) : null}
            <Text variant={isNumber ? 'choice' : 'bodySemi'} tone={selected ? 'onEmber' : isNumber ? 'text' : 'soft'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderCurve: 'continuous',
  },
  groupNumber: { padding: 6, gap: 6, borderRadius: 24 },
  groupTab: { padding: 4, gap: 4, borderRadius: 28 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderCurve: 'continuous' },
  itemNumber: { height: 52, borderRadius: 18 },
  itemTab: { height: 44, borderRadius: 24 },
});
