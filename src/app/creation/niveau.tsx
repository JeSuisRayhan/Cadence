import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { levelImages } from '../../assets/images';
import { Button, ImageTile, Screen, StepHeader, Text } from '../../components';
import { LEVELS, LEVEL_HINT, LEVEL_LABEL } from '../../domain/labels';
import { useDraft } from '../../store/draft';

export default function LevelScreen() {
  const router = useRouter();
  const level = useDraft((s) => s.level);
  const setLevel = useDraft((s) => s.setLevel);

  return (
    <Screen
      scroll
      header={<StepHeader step={2} onBack={() => router.back()} />}
      footer={<Button label="Continuer" onPress={() => router.push('/creation/muscles')} />}
    >
      <Text variant="h1" style={styles.title} accessibilityRole="header">
        Quel est ton niveau ?
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Niveau" style={styles.list}>
        {LEVELS.map((key) => (
          <ImageTile
            key={key}
            source={levelImages[key]}
            selected={level === key}
            onPress={() => setLevel(key)}
            label={`${LEVEL_LABEL[key]}. ${LEVEL_HINT[key]}`}
            radius={26}
            fadeFrom={0.28}
            dim={0.4}
            indicatorSize={28}
            indicatorInset={14}
            style={styles.tile}
            contentStyle={styles.tileText}
          >
            <Text variant="h2">{LEVEL_LABEL[key]}</Text>
            <Text variant="meta" tone="soft">
              {LEVEL_HINT[key]}
            </Text>
          </ImageTile>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 20, maxWidth: 320 },
  list: { marginTop: 24, gap: 12 },
  tile: { height: 150 },
  tileText: { position: 'absolute', left: 18, right: 120, bottom: 14, gap: 2 },
});
