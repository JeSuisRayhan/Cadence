import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, ExerciseThumb, Icon, IconButton, Pill, ProgressBars, Ring, Text } from '../../components';
import { getExercise, type ExerciseDef } from '../../domain/catalog';
import { formatTarget, formatTimer } from '../../domain/format';
import { colors, screenPadding } from '../../theme';
import { REST_STEP_SEC, type NextUp } from '../../workout/machine';

export interface RestViewProps {
  def: ExerciseDef;
  exerciseIndex: number;
  exerciseCount: number;
  setIndex: number;
  totalSets: number;
  target: number;
  remainingSec: number;
  totalSec: number;
  /** la dernière série de la séance vient d'être terminée */
  finished: boolean;
  reps: number;
  failed: boolean;
  next: NextUp | null;
  onAdjustRest: (deltaSec: number) => void;
  onReps: (delta: number) => void;
  onToggleFailed: () => void;
  /** passer le repos, ou terminer la séance quand c'était la dernière série */
  onContinue: () => void;
  onFinish: () => void;
  onClose: () => void;
  /** le panneau YouTube occupe le bas de l'écran : les boutons n'ajoutent pas la marge du bas */
  docked?: boolean;
}

/** Repos entre deux séries : chrono, répétitions faites (ou échec) et série suivante. */
export function RestView({
  def,
  exerciseIndex,
  exerciseCount,
  setIndex,
  totalSets,
  target,
  remainingSec,
  totalSec,
  finished,
  reps,
  failed,
  next,
  onAdjustRest,
  onReps,
  onToggleFailed,
  onContinue,
  onFinish,
  onClose,
  docked = false,
}: RestViewProps) {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 12) + 10;
  const timed = def.unit === 'sec';
  const clock = formatTimer(remainingSec);
  const position = `Exercice ${exerciseIndex + 1} sur ${exerciseCount}`;
  const nextDef = next ? getExercise(next.exerciseId) : null;

  return (
    <View style={styles.root}>
      <View style={{ height: top + 62 }}>
        <View style={[styles.bars, { top }]}>
          <ProgressBars total={exerciseCount} filled={exerciseIndex + 1} accessibilityLabel={position} />
        </View>
        <IconButton icon="close" label="Quitter la séance" onPress={onClose} style={[styles.close, { top: top + 18 }]} />
        <View style={[styles.pill, { top: top + 26 }]}>
          <Pill label={position} tone="surface" />
        </View>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text variant="label" tone="ember" numberOfLines={1}>
          {finished ? 'Fin de séance' : 'Repos'} · {def.name}
        </Text>
        <Text variant="h2Rest" accessibilityRole="header" style={styles.title}>
          {finished ? 'Dernière série terminée' : `Série ${setIndex + 1} sur ${totalSets} terminée`}
        </Text>

        <View style={styles.timerRow}>
          {finished ? (
            <View style={styles.sideSpace} />
          ) : (
            <StepButton label="−15 s" accessibilityLabel="Retirer 15 secondes de repos" onPress={() => onAdjustRest(-REST_STEP_SEC)} />
          )}
          <View style={styles.ringBox}>
            <Ring
              size={202}
              strokeWidth={14}
              progress={finished ? 1 : totalSec > 0 ? remainingSec / totalSec : 0}
              color={finished ? colors.ember : colors.ice}
              accessibilityLabel={finished ? 'Séance terminée' : `Temps de repos restant ${clock}`}
            >
              {finished ? (
                <View style={styles.center}>
                  <Icon name="check" size={72} color={colors.ember} strokeWidth={2.4} />
                  <Text variant="bodyMedium" tone="muted">
                    Bien joué
                  </Text>
                </View>
              ) : (
                <View style={styles.center}>
                  <Text variant="numTimer">{clock}</Text>
                  <Text variant="bodyMedium" tone="muted" style={styles.restLabel}>
                    de repos
                  </Text>
                </View>
              )}
            </Ring>
          </View>
          {finished ? (
            <View style={styles.sideSpace} />
          ) : (
            <StepButton label="+15 s" accessibilityLabel="Ajouter 15 secondes de repos" onPress={() => onAdjustRest(REST_STEP_SEC)} />
          )}
        </View>

        <Card radiusSize="card" style={styles.repsCard}>
          <View style={styles.repsHeader}>
            <Text variant="metaSemi" tone="soft">
              {timed ? 'Secondes tenues' : 'Répétitions faites'}
            </Text>
            <Text variant="caption" tone="subtle">
              Objectif : {timed ? `${target} s` : target}
            </Text>
          </View>
          <View style={styles.repsControls}>
            <View style={[styles.stepper, failed && styles.faded]}>
              <RoundButton icon="minus" label={timed ? 'Une seconde de moins' : 'Une répétition de moins'} onPress={() => onReps(-1)} />
              <Text variant="numField" accessibilityLabel={`${reps} ${timed ? 'secondes' : 'répétitions'}`}>
                {reps}
              </Text>
              <RoundButton icon="plus" label={timed ? 'Une seconde de plus' : 'Une répétition de plus'} onPress={() => onReps(1)} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Échec"
              accessibilityState={{ selected: failed }}
              onPress={onToggleFailed}
              style={[styles.fail, failed && styles.failOn]}
            >
              <Icon name="fail" size={20} color={failed ? colors.ember : colors.text} strokeWidth={2} />
              <Text variant="rowTitle" tone={failed ? 'ember' : 'text'}>
                Échec
              </Text>
            </Pressable>
          </View>
        </Card>

        {nextDef && next ? (
          <View style={styles.next}>
            <Text variant="metaSemi" tone="muted">
              Ensuite
            </Text>
            <Card radiusSize="xxl">
              <View style={styles.nextRow}>
                <ExerciseThumb exerciseId={nextDef.id} size={60} radius={17} />
                <View style={styles.nextText}>
                  <Text variant="rowTitle" numberOfLines={1}>
                    {nextDef.name}
                  </Text>
                  <Text variant="meta" tone="subtle" numberOfLines={1}>
                    Série {next.setNumber} sur {next.totalSets} · {formatTarget(nextDef.unit, next.target)}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: docked ? 8 : Math.max(insets.bottom, 12) + 2 }]}>
        <Button label={finished ? 'Terminer la séance' : 'Passer le repos'} onPress={onContinue} />
        {finished ? null : (
          <Pressable accessibilityRole="button" accessibilityLabel="Terminer la séance" onPress={onFinish} style={styles.quiet}>
            <Text variant="buttonSm" tone="muted">
              Terminer la séance
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function StepButton({ label, accessibilityLabel, onPress }: { label: string; accessibilityLabel: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.step, pressed && styles.pressed]}
    >
      <Text variant="buttonSm">{label}</Text>
    </Pressable>
  );
}

function RoundButton({ icon, label, onPress }: { icon: 'minus' | 'plus'; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && styles.pressed]}
    >
      <Icon name={icon} size={22} color={colors.text} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  bars: { position: 'absolute', left: screenPadding, right: screenPadding, flexDirection: 'row' },
  close: { position: 'absolute', left: screenPadding },
  pill: { position: 'absolute', right: screenPadding },
  scroll: { paddingHorizontal: screenPadding, paddingTop: 12, paddingBottom: 12 },
  title: { marginTop: 4 },
  timerRow: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideSpace: { width: 56 },
  ringBox: { width: 216, height: 216, alignItems: 'center', justifyContent: 'center' },
  step: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: { opacity: 0.8 },
  center: { alignItems: 'center' },
  restLabel: { marginTop: 2 },
  repsCard: { marginTop: 20, paddingTop: 14, paddingBottom: 14, paddingLeft: 16, paddingRight: 14 },
  repsHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  repsControls: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  stepper: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    borderRadius: 30,
    borderCurve: 'continuous',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faded: { opacity: 0.4 },
  round: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  fail: {
    width: 118,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 30,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  failOn: { backgroundColor: colors.emberWash, borderColor: colors.ember },
  next: { marginTop: 18, gap: 8 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4, paddingLeft: 4, paddingRight: 16 },
  nextText: { flex: 1, minWidth: 0, gap: 1 },
  footer: { paddingHorizontal: screenPadding, gap: 2 },
  quiet: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
