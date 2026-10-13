import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { muscleImages, placeImages } from '../../assets/images';
import { Button, Card, Icon, ImageTile, Screen, StepHeader, Switch, Text } from '../../components';
import { MUSCLES, MUSCLE_LABEL, PLACES, PLACE_LABEL } from '../../domain/labels';
import { plural } from '../../domain/format';
import { useDraft } from '../../store/draft';
import { colors, screenPadding } from '../../theme';

const GAP = 10;

export default function MusclesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const muscles = useDraft((s) => s.muscles);
  const place = useDraft((s) => s.place);
  const noWeights = useDraft((s) => s.noWeights);
  const toggleMuscle = useDraft((s) => s.toggleMuscle);
  const toggleAll = useDraft((s) => s.toggleAllMuscles);
  const setPlace = useDraft((s) => s.setPlace);
  const setNoWeights = useDraft((s) => s.setNoWeights);

  const tileWidth = Math.floor((Math.min(width, 560) - screenPadding * 2 - GAP * 2) / 3);
  const count = muscles.length;
  const ready = count > 0;

  return (
    <Screen
      scroll
      header={<StepHeader step={3} onBack={() => router.back()} />}
      footer={
        <Button
          label={ready ? `Continuer · ${plural(count, 'muscle', 'muscles')}` : 'Choisis au moins un muscle'}
          disabled={!ready}
          onPress={() => router.push('/creation/duree')}
        />
      }
    >
      <Text variant="h1" style={styles.title} accessibilityRole="header">
        Quels muscles travailler ?
      </Text>

      <View accessibilityLabel="Muscles à travailler" style={styles.grid}>
        {MUSCLES.map((m) => (
          <ImageTile
            key={m}
            source={muscleImages[m]}
            selected={muscles.includes(m)}
            onPress={() => toggleMuscle(m)}
            label={MUSCLE_LABEL[m]}
            style={{ width: tileWidth, height: 124 }}
            contentStyle={styles.tileLabel}
          >
            <Text variant="bodySemi" style={styles.tileText}>
              {MUSCLE_LABEL[m]}
            </Text>
          </ImageTile>
        ))}
        <ImageTile
          source={muscleImages.corps}
          selected={count === MUSCLES.length}
          onPress={toggleAll}
          label="Tout le corps"
          style={{ width: tileWidth, height: 124 }}
          contentStyle={styles.tileLabel}
        >
          <Text variant="bodySemi" style={styles.tileText}>
            Tout le corps
          </Text>
        </ImageTile>
      </View>

      <Text variant="h3" style={styles.placeTitle} accessibilityRole="header">
        Où t’entraînes-tu ?
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Lieu d’entraînement" style={styles.places}>
        {PLACES.map((p) => (
          <ImageTile
            key={p}
            source={placeImages[p]}
            selected={place === p}
            onPress={() => setPlace(p)}
            label={PLACE_LABEL[p]}
            fadeFrom={0.35}
            style={styles.place}
            contentStyle={styles.placeLabel}
          >
            <Icon name={p === 'maison' ? 'home' : 'dumbbell'} size={17} color={colors.text} strokeWidth={1.9} />
            <Text variant="bodySemi" style={styles.tileText}>
              {PLACE_LABEL[p]}
            </Text>
          </ImageTile>
        ))}
      </View>

      {place === 'maison' ? (
        <Card radiusSize="card" style={styles.weights}>
          <View style={styles.weightsRow}>
            <View style={styles.weightsBadge}>
              <Icon name="dumbbell" size={18} color={colors.ember} />
            </View>
            <View style={styles.weightsText}>
              <Text variant="bodySemi">Pas de poids à la maison</Text>
              <Text variant="caption" tone="subtle">
                {noWeights ? 'Que des exercices au poids du corps' : 'Certains exercices utilisent des haltères'}
              </Text>
            </View>
            <Switch value={noWeights} onValueChange={setNoWeights} label="Pas de poids à la maison" />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 20, maxWidth: 320 },
  grid: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tileLabel: { position: 'absolute', left: 10, right: 8, bottom: 8 },
  tileText: { textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  placeTitle: { marginTop: 20 },
  places: { marginTop: 10, flexDirection: 'row', gap: GAP },
  place: { flex: 1, height: 92 },
  placeLabel: { position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  weights: { marginTop: 12 },
  weightsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 8, paddingLeft: 14, paddingRight: 8 },
  weightsBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
  },
  weightsText: { flex: 1 },
});
