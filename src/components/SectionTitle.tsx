import { StyleSheet, View } from 'react-native';
import { Text, type Tone } from './Text';

export interface SectionTitleProps {
  title: string;
  /** texte discret à droite (« Semaine 3 », « 2 sur 3 ») */
  right?: string;
  rightTone?: Tone;
}

export function SectionTitle({ title, right, rightTone = 'subtle' }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <Text variant="h3" accessibilityRole="header">
        {title}
      </Text>
      {right ? (
        <Text variant="meta" tone={rightTone}>
          {right}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
