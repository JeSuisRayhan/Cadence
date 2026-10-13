import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { finaleImage } from '../../assets/images';
import { BodyMap, Button, Card, Icon, Text, type IconName } from '../../components';
import { formatDateLongLower, formatSets } from '../../domain/format';
import { MUSCLE_LABEL } from '../../domain/labels';
import { stopMusic } from '../../music/player';
import { cancelRestEnd } from '../../notifications';
import { useAppStore } from '../../store';
import { colors, screenPadding } from '../../theme';
import { setsByMuscle } from '../../workout/machine';

const HERO_HEIGHT = 340;

export default function EndScreen() {
  const { logId } = useLocalSearchParams<{ logId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const log = useAppStore((s) => s.history.find((l) => l.id === logId) ?? null);

  // la séance est finie : plus de musique ni de rappel de repos
  useEffect(() => {
    stopMusic();
    void cancelRestEnd();
  }, []);

  if (!log) return <Redirect href="/" />;

  const rows = setsByMuscle(log);
  const minutes = Math.max(1, Math.round(log.durationSec / 60));
  const subtitle = `${log.title} · ${log.completed ? formatDateLongLower(new Date(log.startedAt)) : 'séance écourtée'}`;

  return (
    <View style={styles.root}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ height: HERO_HEIGHT + insets.top }}>
          <Image
            source={finaleImage}
            accessibilityLabel="Les bras levés, fin de séance"
            contentFit="cover"
            contentPosition={{ left: '50%', top: '12%' }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[colors.transparentBg, 'rgba(12,13,15,0.75)', colors.bg]}
            locations={[0.38, 0.72, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroText}>
            <View style={styles.check}>
              <Icon name="check" size={24} color={colors.onEmber} strokeWidth={2.6} />
            </View>
            <Text variant="h1Large" accessibilityRole="header" style={styles.title}>
              {log.completed ? 'Séance terminée' : 'Séance enregistrée'}
            </Text>
            <Text variant="body" tone="muted" style={styles.subtitle}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat icon="clock" label="Durée" value={`${minutes} min`} />
          <Stat icon="flame" label="Calories brûlées" value={`≈ ${log.kcal}`} unit="kcal" />
        </View>

        <Card radiusSize="panel" style={styles.muscles}>
          <Text variant="h3" accessibilityRole="header" style={styles.musclesTitle}>
            Muscles travaillés
          </Text>
          <View style={styles.musclesBody}>
            <BodyMap muscles={rows.map((r) => r.muscle)} width={176} />
            <View style={styles.muscleList}>
              {rows.map((row) => (
                <View key={row.muscle} style={styles.muscleRow}>
                  <View style={styles.muscleName}>
                    <View style={styles.dot} />
                    <Text variant="rowTitle" numberOfLines={1}>
                      {MUSCLE_LABEL[row.muscle]}
                    </Text>
                  </View>
                  <Text variant="caption" tone="subtle">
                    {formatSets(row.sets)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 16 }]}>
        <Button label="Terminer" onPress={() => router.dismissTo('/')} />
      </View>
    </View>
  );
}

function Stat({ icon, label, value, unit }: { icon: IconName; label: string; value: string; unit?: string }) {
  return (
    <Card radiusSize="xxl" style={styles.stat}>
      <View style={styles.statLabel}>
        <Icon name={icon} size={16} color={colors.textMuted} />
        <Text variant="captionMedium" tone="muted">
          {label}
        </Text>
      </View>
      <Text variant="stat" accessibilityLabel={unit ? `${value} ${unit}` : value}>
        {value}
        {unit ? (
          <Text variant="bodyMedium" tone="muted">
            {' '}
            {unit}
          </Text>
        ) : null}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingBottom: 16 },
  heroText: { position: 'absolute', left: screenPadding, right: screenPadding, bottom: 6, alignItems: 'flex-start' },
  check: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ember },
  title: { marginTop: 10 },
  subtitle: { marginTop: 2 },
  stats: { marginTop: 14, marginHorizontal: screenPadding, flexDirection: 'row', gap: 10 },
  stat: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, gap: 2 },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  muscles: { marginTop: 10, marginHorizontal: screenPadding, paddingTop: 14, paddingBottom: 14, paddingLeft: 8, paddingRight: 16 },
  musclesTitle: { marginLeft: 8 },
  musclesBody: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  muscleList: { flex: 1, gap: 14, minWidth: 0 },
  muscleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  muscleName: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.ember },
  footer: { paddingHorizontal: screenPadding, paddingTop: 12 },
});
