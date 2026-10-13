import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { exerciseImages } from '../../assets/images';
import { Button, Card, ExerciseThumb, Icon, IconButton, MetaRow, Pill, Screen, SectionTitle, Text } from '../../components';
import { getExercise } from '../../domain/catalog';
import { formatDateLong, plural, weekdayOf } from '../../domain/format';
import { muscleDots, PLACE_LABEL, WEEKDAY_LETTER, WEEKDAY_LONG } from '../../domain/labels';
import type { PlannedSession, Program } from '../../domain/types';
import {
  nextOccurrence,
  rankInWeek,
  relativeDayLabel,
  upcomingAfter,
  weekNumber,
  weekOf,
  type Occurrence,
  type WeekDay,
} from '../../domain/week';
import { useFocusNow } from '../../hooks/useFocusNow';
import { useStartCreation } from '../../hooks/useStartCreation';
import { useActiveProgram, useAppStore } from '../../store';
import { colors, radius } from '../../theme';

const HERO_HEIGHT = 320;

const heroImage = (session: PlannedSession) => exerciseImages[getExercise(session.exercises[0]?.exerciseId ?? 'pompes').image];

export default function TodayScreen() {
  const router = useRouter();
  const startCreation = useStartCreation();
  const now = useFocusNow();
  const program = useActiveProgram();
  const history = useAppStore((s) => s.history);

  const featured = program ? nextOccurrence(program, history, now) : null;
  const upcoming = program && featured ? upcomingAfter(program, history, now, featured) : [];

  const openSession = (sessionId: string) => router.push({ pathname: '/seance/[id]', params: { id: sessionId } });

  return (
    <Screen scroll tabs>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="bodyMedium" tone="muted" style={styles.date}>
            {formatDateLong(now)}
          </Text>
          <Text variant="title" accessibilityRole="header">
            Aujourd’hui
          </Text>
        </View>
        <IconButton icon="bell" label="Rappels" onPress={() => router.push('/rappel')} />
      </View>

      {program && featured ? (
        <>
          <SessionHero program={program} occurrence={featured} now={now} onStart={() => openSession(featured.session.id)} />

          <View style={styles.sectionTop}>
            <SectionTitle title="Cette semaine" right={`Semaine ${weekNumber(program, now)}`} />
          </View>
          <WeekStrip week={weekOf(program, history, now)} now={now} />

          {upcoming.length > 0 ? (
            <>
              <View style={styles.sectionTopSmall}>
                <SectionTitle title="À venir" />
              </View>
              <Card style={styles.list}>
                {upcoming.map((item, index) => (
                  <UpcomingRow
                    key={`${item.session.id}-${item.offset}`}
                    occurrence={item}
                    now={now}
                    first={index === 0}
                    onPress={() => openSession(item.session.id)}
                  />
                ))}
              </Card>
            </>
          ) : null}
        </>
      ) : (
        <EmptyHero onCreate={startCreation} />
      )}
    </Screen>
  );
}

function SessionHero({
  program,
  occurrence,
  now,
  onStart,
}: {
  program: Program;
  occurrence: Occurrence;
  now: Date;
  onStart: () => void;
}) {
  const { session } = occurrence;
  const { rank, total } = rankInWeek(program, session);
  const pill =
    occurrence.offset === 0
      ? `Séance ${rank} sur ${total} cette semaine`
      : `Prochaine séance · ${relativeDayLabel(occurrence.date, now)}`;

  return (
    <View style={styles.hero}>
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={heroImage(session)}
          contentFit="cover"
          contentPosition={{ left: '56%', top: '50%' }}
          style={[StyleSheet.absoluteFill, styles.heroZoom]}
        />
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.transparentBg, 'rgba(12,13,15,0.72)', 'rgba(12,13,15,0.96)']}
        locations={[0.14, 0.46, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroTop}>
        <View style={styles.heroPillLeft}>
          <Pill label={pill} />
        </View>
        <Pill label={PLACE_LABEL[program.place]} icon={program.place === 'maison' ? 'home' : 'dumbbell'} />
      </View>
      <View style={styles.heroBottom}>
        <Text variant="label" tone="ember" numberOfLines={1}>
          {muscleDots(session.muscles)}
        </Text>
        <Text variant="h1Tight" style={styles.heroTitle} accessibilityRole="header" numberOfLines={1}>
          {session.title}
        </Text>
        <View style={styles.heroMeta}>
          <MetaRow minutes={session.durationMin} exercises={session.exercises.length} kcal={session.kcal} tone="soft" />
        </View>
        <Button label="Commencer la séance" icon="play" onPress={onStart} style={styles.heroButton} />
      </View>
    </View>
  );
}

function EmptyHero({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.hero}>
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={exerciseImages.pompes}
          contentFit="cover"
          contentPosition={{ left: '56%', top: '50%' }}
          style={[StyleSheet.absoluteFill, styles.heroZoom]}
        />
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.transparentBg, 'rgba(12,13,15,0.72)', 'rgba(12,13,15,0.96)']}
        locations={[0.14, 0.46, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroBottom}>
        <Text variant="label" tone="ember">
          Bienvenue
        </Text>
        <Text variant="h1Tight" style={styles.heroTitle} accessibilityRole="header">
          Crée ton premier programme
        </Text>
        <Text variant="body" tone="soft" style={styles.emptyText}>
          Tes jours, ton niveau, tes muscles : le programme se construit en quelques secondes.
        </Text>
        <Button label="Créer mon programme" icon="plus" onPress={onCreate} style={styles.heroButton} />
      </View>
    </View>
  );
}

const weekSummary = (week: WeekDay[], now: Date): string => {
  const today = weekdayOf(now);
  const names = week
    .filter((d) => d.session && d.state !== 'rest')
    .map((d) => {
      const name = WEEKDAY_LONG[d.weekday].toLowerCase();
      if (d.state === 'done') return `${name} (faite)`;
      return d.weekday === today ? `${name} (aujourd’hui)` : name;
    });
  if (names.length === 0) return 'Aucune séance prévue cette semaine';
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
  return `Séances prévues : ${list}`;
};

function WeekStrip({ week, now }: { week: WeekDay[]; now: Date }) {
  const today = weekdayOf(now);
  return (
    <Card accessible accessibilityRole="image" accessibilityLabel={weekSummary(week, now)} style={styles.strip}>
      {week.map((day) => (
        <View key={day.weekday} style={styles.day}>
          <Text variant={day.weekday === today ? 'microBold' : 'microSemi'} tone={day.weekday === today ? 'text' : 'subtle'}>
            {WEEKDAY_LETTER[day.weekday]}
          </Text>
          <DayMark state={day.state} />
        </View>
      ))}
    </Card>
  );
}

function DayMark({ state }: { state: WeekDay['state'] }) {
  if (state === 'rest') {
    return (
      <View style={styles.mark}>
        <View style={styles.dot} />
      </View>
    );
  }
  if (state === 'today') {
    return (
      <View style={[styles.mark, styles.markToday]}>
        <Icon name="dumbbell" size={16} color={colors.onEmber} strokeWidth={2} />
      </View>
    );
  }
  if (state === 'done') {
    return (
      <View style={[styles.mark, styles.markDone]}>
        <Icon name="check" size={16} color={colors.ember} strokeWidth={2.4} />
      </View>
    );
  }
  return (
    <View style={[styles.mark, styles.markOutline, state === 'missed' && styles.markMissed]}>
      <Icon name="dumbbell" size={16} color={state === 'missed' ? colors.textFaint : colors.textMuted} strokeWidth={2} />
    </View>
  );
}

function UpcomingRow({
  occurrence,
  now,
  first,
  onPress,
}: {
  occurrence: Occurrence;
  now: Date;
  first: boolean;
  onPress: () => void;
}) {
  const { session } = occurrence;
  return (
    <>
      {first ? null : <View style={styles.separator} />}
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <ExerciseThumb exerciseId={session.exercises[0]?.exerciseId ?? 'pompes'} size={52} radius={14} />
        <View style={styles.rowText}>
          <Text variant="bodySemi" numberOfLines={1}>
            {relativeDayLabel(occurrence.date, now)} · {session.title}
          </Text>
          <Text variant="caption" tone="subtle" numberOfLines={1}>
            {session.durationMin} min · {plural(session.exercises.length, 'exercice', 'exercices')}
          </Text>
        </View>
        <Icon name="chevron" size={20} color={colors.textSubtle} />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headerText: { gap: 2 },
  date: { lineHeight: 18 },
  hero: {
    marginTop: 16,
    height: HERO_HEIGHT,
    borderRadius: radius.hero,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  heroZoom: { transform: [{ scale: 1.32 }], transformOrigin: '70% 40%' },
  heroTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroPillLeft: { flexShrink: 1 },
  heroBottom: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  heroTitle: { marginTop: 4 },
  heroMeta: { marginTop: 8 },
  heroButton: { marginTop: 16 },
  emptyText: { marginTop: 6 },
  sectionTop: { paddingTop: 22 },
  sectionTopSmall: { paddingTop: 20 },
  strip: {
    marginTop: 10,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  day: { flex: 1, alignItems: 'center', gap: 8 },
  mark: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  markToday: { backgroundColor: colors.ember },
  markDone: { backgroundColor: colors.emberTint },
  markOutline: { borderWidth: 1.5, borderColor: colors.outlineStrong },
  markMissed: { borderColor: colors.borderSoft },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  list: { marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingLeft: 8, paddingRight: 14 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.03)' },
  rowText: { flex: 1, gap: 2 },
  separator: { height: 1, marginLeft: 68, marginRight: 14, backgroundColor: colors.border },
});
