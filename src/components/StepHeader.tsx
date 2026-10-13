import { StyleSheet, View } from 'react-native';
import { IconButton } from './IconButton';
import { ProgressBars } from './ProgressBars';
import { Text } from './Text';

export interface StepHeaderProps {
  step: number;
  total?: number;
  onBack: () => void;
}

/** En-tête des étapes de création : retour, quatre barres, « n/4 ». */
export function StepHeader({ step, total = 4, onBack }: StepHeaderProps) {
  return (
    <View style={styles.row}>
      <IconButton icon="back" label="Retour" onPress={onBack} />
      <ProgressBars total={total} filled={step} accessibilityLabel={`Étape ${step} sur ${total}`} />
      <Text variant="metaSemi" tone="muted" align="right" style={styles.count}>
        {step}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  count: { minWidth: 30 },
});
