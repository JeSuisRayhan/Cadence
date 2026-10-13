import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { muscleImages, placeImages } from '../../assets/images';
import { Button, Card, ConfirmSheet, ExerciseThumb, Icon, IconButton, Screen, Text } from '../../components';
import { capitalize, formatMinutes, plural } from '../../domain/format';
import { LEVEL_LABEL, muscleSentence, PLACE_LABEL, WEEKDAY_SHORT } from '../../domain/labels';
import type { Program } from '../../domain/types';
import { useStartCreation } from '../../hooks/useStartCreation';
import { useAppStore } from '../../store';
import { colors, radius } from '../../theme';

export default function ProgramsScreen() {
  const router = useRouter();
  const startCreation = useStartCreation();
  const programs = useAppStore((s) => s.programs);
  const activeId = useAppStore((s) => s.activeProgramId);
  const setActive = useAppStore((s) => s.setActiveProgram);
  const remove = useAppStore((s) => s.deleteProgram);
  const [pendingDelete, setPendingDelete] = useState<Program | null>(null);

  return (
    <Screen scroll tabs>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          Programmes
        </Text>
        {programs.length > 0 ? <IconButton icon="plus" label="Nouveau programme" onPress={startCreation} /> : null}
      </View>

      {programs.length === 0 ? (
        <View style={styles.empty}>
          <Image source={muscleImages.corps} contentFit="cover" style={StyleSheet.absoluteFill} />
          <LinearGradient
            pointerEvents="none"
            colors={[colors.transparentBg, 'rgba(12,13,15,0.72)', 'rgba(12,13,15,0.96)']}
            locations={[0.1, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.emptyBody}>
            <Text variant="h2" accessibilityRole="header">
              Aucun programme
            </Text>
            <Text variant="body" tone="soft" style={styles.emptyText}>
              Choisis tes jours, ton niveau et tes muscles : tes séances sont prêtes en quelques secondes.
            </Text>
            <Button label="Créer mon programme" icon="plus" onPress={startCreation} style={styles.emptyButton} />
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              active={program.id === activeId}
              onActivate={() => setActive(program.id)}
              onOpen={(sessionId) => router.push({ pathname: '/seance/[id]', params: { id: sessionId } })}
              onDelete={() => setPendingDelete(program)}
            />
          ))}
        </View>
      )}

      <ConfirmSheet
        visible={pendingDelete !== null}
        title="Supprimer ce programme ?"
        message="Ses séances disparaissent. Ton historique est conservé."
        safeLabel="Garder"
        confirmLabel="Supprimer"
        onSafe={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </Screen>
  );
}

function ProgramCard({
  program,
  active,
  onActivate,
  onOpen,
  onDelete,
}: {
  program: Program;
  active: boolean;
  onActivate: () => void;
  onOpen: (sessionId: string) => void;
  onDelete: () => void;
}) {
  return (
    <Card radiusSize="panel" style={active ? styles.cardActive : undefined}>
      <View style={styles.cardHeader}>
        <Image source={placeImages[program.place]} contentFit="cover" style={styles.place} />
        <View style={styles.cardTitle}>
          <Text variant="rowTitle" numberOfLines={1}>
            {plural(program.sessions.length, 'séance', 'séances')} par semaine
          </Text>
          <Text variant="caption" tone="subtle" numberOfLines={1}>
            {LEVEL_LABEL[program.level]} · {PLACE_LABEL[program.place]} · {formatMinutes(program.durationMin)}
          </Text>
        </View>
        {active ? (
          <View style={styles.badge}>
            <Text variant="microBold" tone="ember">
              Actif
            </Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Utiliser ce programme"
            onPress={onActivate}
            style={({ pressed }) => [styles.activate, pressed && styles.pressed]}
          >
            <Text variant="captionSemi">Utiliser</Text>
          </Pressable>
        )}
      </View>
      <Text variant="caption" tone="muted" numberOfLines={2} style={styles.muscles}>
        {capitalize(muscleSentence(program.muscles))}
      </Text>

      <View style={styles.sessions}>
        {program.sessions.map((session) => (
          <Pressable
            key={session.id}
            accessibilityRole="button"
            accessibilityLabel={`${session.title}, ${WEEKDAY_SHORT[session.weekday]}`}
            onPress={() => onOpen(session.id)}
            style={({ pressed }) => [styles.session, pressed && styles.rowPressed]}
          >
            <ExerciseThumb exerciseId={session.exercises[0]?.exerciseId ?? 'pompes'} size={44} radius={12} />
            <View style={styles.sessionText}>
              <Text variant="bodySemi" numberOfLines={1}>
                {WEEKDAY_SHORT[session.weekday]} · {session.title}
              </Text>
              <Text variant="caption" tone="subtle" numberOfLines={1}>
                {session.durationMin} min · {plural(session.exercises.length, 'exercice', 'exercices')}
              </Text>
            </View>
            <Icon name="chevron" size={20} color={colors.textSubtle} />
          </Pressable>
        ))}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Supprimer ce programme" onPress={onDelete} style={styles.delete}>
        <Icon name="trash" size={18} color={colors.textSubtle} />
        <Text variant="metaSemi" tone="subtle">
          Supprimer ce programme
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { marginTop: 16, gap: 12 },
  cardActive: { borderColor: colors.emberLine },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingHorizontal: 12 },
  place: { width: 52, height: 52, borderRadius: 14, borderCurve: 'continuous', backgroundColor: colors.surfaceRaised },
  cardTitle: { flex: 1, minWidth: 0 },
  badge: { height: 28, paddingHorizontal: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.emberTint },
  activate: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  pressed: { opacity: 0.8 },
  muscles: { paddingHorizontal: 14, marginTop: 10 },
  sessions: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  session: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingLeft: 12, paddingRight: 14 },
  rowPressed: { backgroundColor: 'rgba(255,255,255,0.03)' },
  sessionText: { flex: 1, minWidth: 0 },
  delete: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  empty: { marginTop: 16, height: 360, borderRadius: radius.hero, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: colors.surface },
  emptyBody: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  emptyText: { marginTop: 6 },
  emptyButton: { marginTop: 16 },
});
