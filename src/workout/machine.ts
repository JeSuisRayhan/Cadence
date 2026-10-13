import { getExercise } from '../domain/catalog';
import { kcalForSeconds } from '../domain/estimates';
import type { ExerciseLog, Muscle, PlannedExercise, PlannedSession, Program, SessionLog, SetLog } from '../domain/types';

/** Valeur maximale du compteur de répétitions saisi pendant le repos. */
export const MAX_REPS = 99;
/** Pas du bouton « −15 s / +15 s » du repos. */
export const REST_STEP_SEC = 15;
/** On ne descend pas sous cette durée de repos avec « −15 s ». */
export const REST_MIN_SEC = 5;

export interface WorkoutState {
  startedAt: number;
  /** `exercise` : série en cours ; `rest` : série terminée, on se repose (ou la séance est finie) */
  phase: 'exercise' | 'rest';
  /** exercice en cours dans le plan */
  exercise: number;
  /** série en cours (0 = première), ou série qui vient d'être terminée pendant le repos */
  set: number;
  restEndsAt: number | null;
  restTotalSec: number;
  /** fin du chrono d'un exercice chronométré (planche…), s'il est lancé */
  timedEndsAt: number | null;
  /** séries enregistrées, par exercice */
  sets: SetLog[][];
  /** valeur affichée dans le compteur pendant le repos, conservée quand « échec » est activé */
  draftReps: number;
  draftFailed: boolean;
  /** la dernière série du plan est terminée */
  done: boolean;
}

export type WorkoutAction =
  | { type: 'start-timed'; now: number }
  | { type: 'complete'; now: number }
  | { type: 'skip-rest' }
  | { type: 'adjust-rest'; deltaSec: number; now: number }
  | { type: 'reps'; delta: number }
  | { type: 'toggle-failed' }
  | { type: 'tick'; now: number };

export const initialWorkout = (plan: readonly PlannedExercise[], startedAt: number): WorkoutState => ({
  startedAt,
  phase: 'exercise',
  exercise: 0,
  set: 0,
  restEndsAt: null,
  restTotalSec: 0,
  timedEndsAt: null,
  sets: plan.map(() => []),
  draftReps: 0,
  draftFailed: false,
  done: false,
});

export const isLastSet = (plan: readonly PlannedExercise[], exercise: number, set: number): boolean =>
  exercise === plan.length - 1 && set === plan[exercise].sets - 1;

export const plannedSetCount = (plan: readonly PlannedExercise[]): number => plan.reduce((sum, ex) => sum + ex.sets, 0);

export const loggedSetCount = (state: Pick<WorkoutState, 'sets'>): number =>
  state.sets.reduce((sum, sets) => sum + sets.length, 0);

const writeCurrentSet = (state: WorkoutState, log: SetLog): SetLog[][] =>
  state.sets.map((sets, i) => (i === state.exercise ? [...sets.slice(0, state.set), log] : sets));

const complete = (plan: readonly PlannedExercise[], state: WorkoutState, now: number): WorkoutState => {
  if (state.phase !== 'exercise' || state.done) return state;
  const exercise = plan[state.exercise];
  let reps = exercise.target;
  if (getExercise(exercise.exerciseId).unit === 'sec' && state.timedEndsAt !== null) {
    // chrono arrêté avant la fin : on compte les secondes réellement tenues
    const remaining = Math.max(0, Math.ceil((state.timedEndsAt - now) / 1000));
    reps = Math.min(exercise.target, Math.max(1, exercise.target - remaining));
  }
  const last = isLastSet(plan, state.exercise, state.set);
  return {
    ...state,
    phase: 'rest',
    sets: writeCurrentSet(state, { target: exercise.target, done: reps, failed: false }),
    timedEndsAt: null,
    draftReps: reps,
    draftFailed: false,
    done: last,
    restEndsAt: last ? null : now + exercise.restSec * 1000,
    restTotalSec: last ? 0 : exercise.restSec,
  };
};

const leaveRest = (plan: readonly PlannedExercise[], state: WorkoutState): WorkoutState => {
  if (state.phase !== 'rest' || state.done) return state;
  const sameExercise = state.set + 1 < plan[state.exercise].sets;
  return {
    ...state,
    phase: 'exercise',
    exercise: sameExercise ? state.exercise : state.exercise + 1,
    set: sameExercise ? state.set + 1 : 0,
    restEndsAt: null,
    timedEndsAt: null,
  };
};

const writeDraft = (state: WorkoutState, draftReps: number, draftFailed: boolean): WorkoutState => {
  const target = state.sets[state.exercise]?.[state.set]?.target ?? draftReps;
  return {
    ...state,
    draftReps,
    draftFailed,
    sets: writeCurrentSet(state, { target, done: draftFailed ? null : draftReps, failed: draftFailed }),
  };
};

/** Fonction pure : le temps est toujours fourni par l'appelant (`now`, en millisecondes). */
export const workoutReducer = (plan: readonly PlannedExercise[], state: WorkoutState, action: WorkoutAction): WorkoutState => {
  switch (action.type) {
    case 'start-timed': {
      if (state.phase !== 'exercise' || state.done || state.timedEndsAt !== null) return state;
      const exercise = plan[state.exercise];
      if (getExercise(exercise.exerciseId).unit !== 'sec') return state;
      return { ...state, timedEndsAt: action.now + exercise.target * 1000 };
    }
    case 'complete':
      return complete(plan, state, action.now);
    case 'skip-rest':
      return leaveRest(plan, state);
    case 'adjust-rest': {
      if (state.phase !== 'rest' || state.restEndsAt === null) return state;
      const left = (state.restEndsAt - action.now) / 1000;
      // « −15 s » ne rallonge jamais un repos presque fini
      const next = action.deltaSec < 0 ? Math.min(left, Math.max(REST_MIN_SEC, left + action.deltaSec)) : left + action.deltaSec;
      return {
        ...state,
        restEndsAt: action.now + next * 1000,
        restTotalSec: Math.max(state.restTotalSec, Math.ceil(next)),
      };
    }
    case 'reps': {
      if (state.phase !== 'rest') return state;
      const next = Math.min(MAX_REPS, Math.max(0, state.draftReps + action.delta));
      // toucher le compteur annule « échec », comme dans la maquette
      return writeDraft(state, next, false);
    }
    case 'toggle-failed': {
      if (state.phase !== 'rest') return state;
      return writeDraft(state, state.draftReps, !state.draftFailed);
    }
    case 'tick': {
      if (state.phase === 'rest' && state.restEndsAt !== null && action.now >= state.restEndsAt) {
        return leaveRest(plan, state);
      }
      if (state.phase === 'exercise' && state.timedEndsAt !== null && action.now >= state.timedEndsAt) {
        return complete(plan, state, action.now);
      }
      return state;
    }
  }
};

/** Secondes de repos restantes (arrondies au-dessus), 0 si on ne se repose pas. */
export const restRemainingSec = (state: WorkoutState, now: number): number =>
  state.phase === 'rest' && state.restEndsAt !== null ? Math.max(0, Math.ceil((state.restEndsAt - now) / 1000)) : 0;

/** Secondes restantes du chrono d'un exercice chronométré, ou null s'il n'est pas lancé. */
export const timedRemainingSec = (state: WorkoutState, now: number): number | null =>
  state.timedEndsAt === null ? null : Math.max(0, Math.ceil((state.timedEndsAt - now) / 1000));

export interface NextUp {
  exerciseId: string;
  /** numéro de la série à venir (à partir de 1) */
  setNumber: number;
  totalSets: number;
  target: number;
}

/** La série qui suivra le repos en cours. Null après la dernière série. */
export const nextUp = (plan: readonly PlannedExercise[], state: WorkoutState): NextUp | null => {
  if (state.done) return null;
  const current = plan[state.exercise];
  if (state.set + 1 < current.sets) {
    return { exerciseId: current.exerciseId, setNumber: state.set + 2, totalSets: current.sets, target: current.target };
  }
  const following = plan[state.exercise + 1];
  return following ? { exerciseId: following.exerciseId, setNumber: 1, totalSets: following.sets, target: following.target } : null;
};

export interface BuildLogInput {
  id: string;
  program: Pick<Program, 'id'>;
  session: PlannedSession;
  state: WorkoutState;
  endedAt: number;
}

/** Résultat de la séance : seules les séries réellement faites sont enregistrées. */
export const buildSessionLog = ({ id, program, session, state, endedAt }: BuildLogInput): SessionLog => {
  const exercises: ExerciseLog[] = session.exercises
    .map((planned, index) => ({ exerciseId: planned.exerciseId, sets: state.sets[index] ?? [] }))
    .filter((entry) => entry.sets.length > 0);
  const durationSec = Math.max(1, Math.round((endedAt - state.startedAt) / 1000));
  return {
    id,
    programId: program.id,
    sessionId: session.id,
    title: session.title,
    muscles: session.muscles,
    startedAt: state.startedAt,
    endedAt,
    durationSec,
    kcal: kcalForSeconds(durationSec),
    exercises,
    completed: state.done,
  };
};

/** Séries faites par muscle principal, dans l'ordre des muscles de la séance. */
export const setsByMuscle = (log: Pick<SessionLog, 'exercises' | 'muscles'>): { muscle: Muscle; sets: number }[] => {
  const counts = new Map<Muscle, number>();
  for (const entry of log.exercises) {
    const primary = getExercise(entry.exerciseId).muscles[0];
    counts.set(primary, (counts.get(primary) ?? 0) + entry.sets.length);
  }
  const ordered: Muscle[] = [...log.muscles.filter((m) => counts.has(m)), ...[...counts.keys()].filter((m) => !log.muscles.includes(m))];
  return ordered.map((muscle) => ({ muscle, sets: counts.get(muscle) ?? 0 }));
};
