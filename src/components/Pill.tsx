import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface PillProps {
  label: string;
  icon?: IconName;
  /** `scrim` : posée sur une image ; `surface` : posée sur le fond de l'écran */
  tone?: 'scrim' | 'surface';
}

/** Petite étiquette : sur une image (voile sombre) ou sur le fond. */
export function Pill({ label, icon, tone = 'scrim' }: PillProps) {
  return (
    <View style={[styles.pill, tone === 'surface' && styles.surface]}>
      {icon ? <Icon name={icon} size={15} color={colors.text} strokeWidth={1.9} /> : null}
      <Text variant="captionSemi" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.scrim,
  },
  surface: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
});
