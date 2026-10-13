import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { ConfirmSheet } from '../../../components';
import { getExercise } from '../../../domain/catalog';
import { uid } from '../../../domain/id';
import type { PlannedSession, Program } from '../../../domain/types';
import { ExerciseView } from '../../../features/seance/ExerciseView';
import { RestView } from '../../../features/seance/RestView';
import { YoutubeDock } from '../../../features/seance/YoutubeDock';
import { haptics } from '../../../hooks/useHaptics';
import { useNow } from '../../../hooks/useNow';
import { stopMusic, usePlayer } from '../../../music/player';
import { startSessionMusic } from '../../../music/session';
import { cancelRestEnd, scheduleRestEnd } from '../../../notifications';
import { findSession, useAppStore } from '../../../store';
import { colors } from '../../../theme';
import {
  buildSessionLog,
  initialWorkout,
  loggedSetCount,
  nextUp,
  restRemainingSec,
  timedRemainingSec,
  workoutReducer,
  type WorkoutAction,
  type WorkoutState,
} from '../../../workout/machine';

export default function WorkoutRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const programs = useAppStore((s) => s.programs);
  const found = findSession(programs, id);
  if (!found) return <Redirect href="/" />;
  return <Workout key={found.session.id} program={found.program} session={found.session} />;
}

function Workout({ program, session }: { program: Program; session: PlannedSession }) {
  useKeepAwake();
  const router = useRouter();
  const addLog = useAppStore((s) => s.addLog);
  const music = useAppStore((s) => s.music);
  const youtube = usePlayer((s) => s.youtube);

  const plan = session.exercises;
  const reducer = useMemo(() => (state: WorkoutState, action: WorkoutAction) => workoutReducer(plan, state, action), [plan]);
  const [state, dispatch] = useReducer(reducer, undefined, () => initialWorkout(plan, Date.now()));
  const now = useNow(250);
  const [confirming, setConfirming] = useState(false);

  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  // le chrono de repos et celui d'un exercice chronométré s'arrêtent d'eux-mêmes
  useEffect(() => {
    dispatch({ type: 'tick', now });
  }, [now]);

  // retour tactile quand la série ou le repos change
  const previous = useRef({ phase: state.phase, exercise: state.exercise, set: state.set });
  useEffect(() => {
    const before = previous.current;
    if (before.phase !== state.phase) {
      if (state.phase === 'rest') haptics.set();
      else haptics.go();
    }
    previous.current = { phase: state.phase, exercise: state.exercise, set: state.set };
  }, [state.phase, state.exercise, state.set]);

  // la musique démarre avec la séance
  const musicStarted = useRef(false);
  useEffect(() => {
    if (musicStarted.current) return;
    musicStarted.current = true;
    if (music.autoStart) void startSessionMusic({ id: session.id, durationMin: session.durationMin }, music);
  }, [music, session.id, session.durationMin]);

  // en arrière-plan pendant un repos : une notification prévient de la fin
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void cancelRestEnd();
        return;
      }
      const current = latest.current;
      if (current.phase !== 'rest' || current.restEndsAt === null) return;
      const seconds = (current.restEndsAt - Date.now()) / 1000;
      const upcoming = nextUp(plan, current);
      if (seconds > 1 && upcoming) {
        const name = getExercise(upcoming.exerciseId).name;
        void scheduleRestEnd(seconds, `${name} · série ${upcoming.setNumber} sur ${upcoming.totalSets}`);
      }
    });
    return () => {
      subscription.remove();
      void cancelRestEnd();
    };
  }, [plan]);

  // le bouton retour d'Android demande confirmation au lieu de quitter la séance
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        setConfirming(true);
        return true;
      });
      return () => subscription.remove();
    }, []),
  );

  const quit = useCallback(() => {
    stopMusic();
    void cancelRestEnd();
    setConfirming(false);
    router.dismissTo('/');
  }, [router]);

  const finish = useCallback(() => {
    const current = latest.current;
    if (loggedSetCount(current) === 0) {
      quit();
      return;
    }
    const log = buildSessionLog({ id: uid(), program, session, state: current, endedAt: Date.now() });
    addLog(log);
    stopMusic();
    void cancelRestEnd();
    setConfirming(false);
    router.replace({ pathname: '/fin/[logId]', params: { logId: log.id } });
  }, [addLog, program, quit, router, session]);

  const startMusic = useCallback(() => {
    void startSessionMusic({ id: session.id, durationMin: session.durationMin }, music);
  }, [music, session.id, session.durationMin]);

  const planned = plan[state.exercise];
  const def = getExercise(planned.exerciseId);
  const hasProgress = loggedSetCount(state) > 0;

  const docked = youtube !== null;

  return (
    <>
      <View style={styles.screen}>
        {state.phase === 'exercise' ? (
          <ExerciseView
            def={def}
            exerciseIndex={state.exercise}
            exerciseCount={plan.length}
            setIndex={state.set}
            totalSets={planned.sets}
            target={planned.target}
            timedLeft={timedRemainingSec(state, now)}
            onComplete={() => dispatch({ type: 'complete', now: Date.now() })}
            onStartTimed={() => dispatch({ type: 'start-timed', now: Date.now() })}
            onClose={() => setConfirming(true)}
            onStartMusic={startMusic}
            docked={docked}
          />
        ) : (
          <RestView
            def={def}
            exerciseIndex={state.exercise}
            exerciseCount={plan.length}
            setIndex={state.set}
            totalSets={planned.sets}
            target={planned.target}
            remainingSec={restRemainingSec(state, now)}
            totalSec={state.restTotalSec}
            finished={state.done}
            reps={state.draftReps}
            failed={state.draftFailed}
            next={nextUp(plan, state)}
            onAdjustRest={(deltaSec) => {
              haptics.tick();
              dispatch({ type: 'adjust-rest', deltaSec, now: Date.now() });
            }}
            onReps={(delta) => {
              haptics.tick();
              dispatch({ type: 'reps', delta });
            }}
            onToggleFailed={() => {
              haptics.tick();
              dispatch({ type: 'toggle-failed' });
            }}
            onContinue={state.done ? finish : () => dispatch({ type: 'skip-rest' })}
            onFinish={finish}
            onClose={() => setConfirming(true)}
            docked={docked}
          />
        )}
        {/* au-dessus des deux écrans, jamais à l'intérieur : la lecture ne redémarre pas quand on passe de l'exercice au repos */}
        {youtube ? <YoutubeDock key={youtube.id} link={youtube} /> : null}
      </View>
      <ConfirmSheet
        visible={confirming}
        title="Quitter la séance ?"
        message={hasProgress ? 'Tu peux garder ce que tu as déjà fait en terminant ici.' : 'Tu n’as pas encore commencé : rien ne sera enregistré.'}
        safeLabel="Continuer la séance"
        confirmLabel="Quitter sans enregistrer"
        extra={hasProgress ? { label: 'Terminer et enregistrer', onPress: finish } : undefined}
        onSafe={() => setConfirming(false)}
        onConfirm={quit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
});
