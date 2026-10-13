import type { PlannedExercise, PlannedSession } from '../../domain/types';
import {
  buildSessionLog,
  initialWorkout,
  loggedSetCount,
  nextUp,
  plannedSetCount,
  restRemainingSec,
  setsByMuscle,
  timedRemainingSec,
  workoutReducer,
  type WorkoutAction,
  type WorkoutState,
} from '../machine';

const PLAN: PlannedExercise[] = [
  { exerciseId: 'pompes', sets: 3, target: 12, restSec: 90 },
  { exerciseId: 'planche', sets: 2, target: 30, restSec: 60 },
  { exerciseId: 'crunch', sets: 1, target: 15, restSec: 60 },
];

const T0 = 1_000_000;
const run = (state: WorkoutState, ...actions: WorkoutAction[]): WorkoutState =>
  actions.reduce((s, a) => workoutReducer(PLAN, s, a), state);

const start = () => initialWorkout(PLAN, T0);

describe('déroulé d’une séance', () => {
  it('démarre sur la première série du premier exercice', () => {
    const s = start();
    expect(s).toMatchObject({ phase: 'exercise', exercise: 0, set: 0, done: false });
    expect(plannedSetCount(PLAN)).toBe(6);
    expect(loggedSetCount(s)).toBe(0);
  });

  it('OK lance le repos et enregistre la série avec l’objectif atteint', () => {
    const s = run(start(), { type: 'complete', now: T0 + 40_000 });
    expect(s.phase).toBe('rest');
    expect(s.restEndsAt).toBe(T0 + 40_000 + 90_000);
    expect(s.restTotalSec).toBe(90);
    expect(s.sets[0]).toEqual([{ target: 12, done: 12, failed: false }]);
    expect(s.draftReps).toBe(12);
    expect(restRemainingSec(s, T0 + 40_000)).toBe(90);
    expect(restRemainingSec(s, T0 + 100_000)).toBe(30);
  });

  it('à la fin du repos, la série suivante du même exercice commence toute seule', () => {
    let s = run(start(), { type: 'complete', now: T0 });
    s = run(s, { type: 'tick', now: T0 + 89_000 });
    expect(s.phase).toBe('rest');
    s = run(s, { type: 'tick', now: T0 + 90_000 });
    expect(s).toMatchObject({ phase: 'exercise', exercise: 0, set: 1, restEndsAt: null });
  });

  it('« Passer le repos » enchaîne tout de suite', () => {
    const s = run(start(), { type: 'complete', now: T0 }, { type: 'skip-rest' });
    expect(s).toMatchObject({ phase: 'exercise', exercise: 0, set: 1 });
  });

  it('passe à l’exercice suivant après la dernière série', () => {
    let s = start();
    for (let i = 0; i < 3; i += 1) s = run(s, { type: 'complete', now: T0 }, { type: 'skip-rest' });
    expect(s).toMatchObject({ phase: 'exercise', exercise: 1, set: 0 });
    expect(s.sets[0]).toHaveLength(3);
  });

  it('termine la séance à la dernière série : plus de chrono, plus de suite', () => {
    let s = start();
    for (let i = 0; i < 5; i += 1) {
      s = run(s, { type: 'complete', now: T0 }, { type: 'skip-rest' });
    }
    expect(s).toMatchObject({ exercise: 2, set: 0, phase: 'exercise', done: false });
    s = run(s, { type: 'complete', now: T0 + 1000 });
    expect(s).toMatchObject({ phase: 'rest', done: true, restEndsAt: null, restTotalSec: 0 });
    expect(loggedSetCount(s)).toBe(6);
    expect(nextUp(PLAN, s)).toBeNull();
    // plus aucune transition possible
    expect(run(s, { type: 'skip-rest' })).toBe(s);
    expect(run(s, { type: 'tick', now: T0 + 10 ** 9 })).toBe(s);
    expect(run(s, { type: 'complete', now: T0 + 2000 })).toBe(s);
  });

  it('ignore les actions hors de leur phase', () => {
    const s = start();
    expect(run(s, { type: 'skip-rest' })).toBe(s);
    expect(run(s, { type: 'reps', delta: 1 })).toBe(s);
    expect(run(s, { type: 'toggle-failed' })).toBe(s);
    expect(run(s, { type: 'adjust-rest', deltaSec: 15, now: T0 })).toBe(s);
    expect(run(s, { type: 'tick', now: T0 + 10 ** 6 })).toBe(s);
    expect(run(s, { type: 'start-timed', now: T0 })).toBe(s);
  });
});

describe('saisie pendant le repos', () => {
  const resting = () => run(start(), { type: 'complete', now: T0 });

  it('le compteur corrige la série enregistrée', () => {
    const s = run(resting(), { type: 'reps', delta: -1 }, { type: 'reps', delta: -1 });
    expect(s.draftReps).toBe(10);
    expect(s.sets[0][0]).toEqual({ target: 12, done: 10, failed: false });
  });

  it('reste entre 0 et 99', () => {
    let s = resting();
    for (let i = 0; i < 20; i += 1) s = run(s, { type: 'reps', delta: -1 });
    expect(s.draftReps).toBe(0);
    for (let i = 0; i < 120; i += 1) s = run(s, { type: 'reps', delta: 1 });
    expect(s.draftReps).toBe(99);
  });

  it('« échec » enregistre une série ratée sans effacer le nombre affiché', () => {
    let s = run(resting(), { type: 'reps', delta: -4 }, { type: 'toggle-failed' });
    expect(s.sets[0][0]).toEqual({ target: 12, done: null, failed: true });
    expect(s.draftReps).toBe(8);
    s = run(s, { type: 'toggle-failed' });
    expect(s.sets[0][0]).toEqual({ target: 12, done: 8, failed: false });
  });

  it('toucher le compteur annule « échec »', () => {
    const s = run(resting(), { type: 'toggle-failed' }, { type: 'reps', delta: 1 });
    expect(s.draftFailed).toBe(false);
    expect(s.sets[0][0]).toEqual({ target: 12, done: 13, failed: false });
  });

  it('le résultat saisi est conservé quand le repos se termine', () => {
    let s = run(resting(), { type: 'reps', delta: -2 });
    s = run(s, { type: 'tick', now: T0 + 90_000 });
    expect(s.phase).toBe('exercise');
    expect(s.sets[0][0].done).toBe(10);
  });

  it('un échec saisi sur la dernière série reste modifiable', () => {
    let s = start();
    for (let i = 0; i < 5; i += 1) s = run(s, { type: 'complete', now: T0 }, { type: 'skip-rest' });
    s = run(s, { type: 'complete', now: T0 }, { type: 'toggle-failed' });
    expect(s.done).toBe(true);
    expect(s.sets[2][0]).toEqual({ target: 15, done: null, failed: true });
  });
});

describe('chrono de repos', () => {
  const resting = () => run(start(), { type: 'complete', now: T0 });

  it('+15 s rallonge le repos et agrandit l’anneau', () => {
    const s = run(resting(), { type: 'adjust-rest', deltaSec: 15, now: T0 + 30_000 });
    expect(restRemainingSec(s, T0 + 30_000)).toBe(75);
    expect(s.restTotalSec).toBe(90);
    const late = run(resting(), { type: 'adjust-rest', deltaSec: 15, now: T0 + 5_000 });
    expect(restRemainingSec(late, T0 + 5_000)).toBe(100);
    expect(late.restTotalSec).toBe(100);
  });

  it('−15 s raccourcit sans descendre sous 5 s', () => {
    const s = run(resting(), { type: 'adjust-rest', deltaSec: -15, now: T0 + 50_000 });
    expect(restRemainingSec(s, T0 + 50_000)).toBe(25);
    const low = run(s, { type: 'adjust-rest', deltaSec: -15, now: T0 + 50_000 });
    expect(restRemainingSec(low, T0 + 50_000)).toBe(10);
    const floor = run(low, { type: 'adjust-rest', deltaSec: -15, now: T0 + 50_000 });
    expect(restRemainingSec(floor, T0 + 50_000)).toBe(5);
  });

  it('−15 s ne rallonge jamais un repos presque terminé', () => {
    const s = run(resting(), { type: 'adjust-rest', deltaSec: -15, now: T0 + 87_000 });
    expect(restRemainingSec(s, T0 + 87_000)).toBe(3);
  });

  it('un repos très long reste correct après un retour d’arrière-plan', () => {
    const s = run(resting(), { type: 'tick', now: T0 + 10 * 60_000 });
    expect(s).toMatchObject({ phase: 'exercise', set: 1 });
  });
});

describe('exercice chronométré', () => {
  const atPlanche = () => {
    let s = start();
    for (let i = 0; i < 3; i += 1) s = run(s, { type: 'complete', now: T0 }, { type: 'skip-rest' });
    return s;
  };

  it('le chrono se lance, puis la série se termine toute seule à zéro', () => {
    let s = run(atPlanche(), { type: 'start-timed', now: T0 });
    expect(timedRemainingSec(s, T0 + 10_000)).toBe(20);
    expect(run(s, { type: 'start-timed', now: T0 + 5000 })).toBe(s);
    s = run(s, { type: 'tick', now: T0 + 29_999 });
    expect(s.phase).toBe('exercise');
    s = run(s, { type: 'tick', now: T0 + 30_000 });
    expect(s.phase).toBe('rest');
    expect(s.sets[1][0]).toEqual({ target: 30, done: 30, failed: false });
    expect(s.restTotalSec).toBe(60);
    expect(s.timedEndsAt).toBeNull();
  });

  it('OK avant la fin compte les secondes réellement tenues', () => {
    const s = run(atPlanche(), { type: 'start-timed', now: T0 }, { type: 'complete', now: T0 + 18_000 });
    expect(s.sets[1][0]).toEqual({ target: 30, done: 18, failed: false });
  });

  it('ne lance pas de chrono sur un exercice en répétitions', () => {
    const s = start();
    expect(run(s, { type: 'start-timed', now: T0 })).toBe(s);
  });
});

describe('série suivante annoncée', () => {
  it('même exercice, puis exercice suivant', () => {
    let s = run(start(), { type: 'complete', now: T0 });
    expect(nextUp(PLAN, s)).toEqual({ exerciseId: 'pompes', setNumber: 2, totalSets: 3, target: 12 });
    s = run(s, { type: 'skip-rest' }, { type: 'complete', now: T0 }, { type: 'skip-rest' }, { type: 'complete', now: T0 });
    expect(s).toMatchObject({ exercise: 0, set: 2 });
    expect(nextUp(PLAN, s)).toEqual({ exerciseId: 'planche', setNumber: 1, totalSets: 2, target: 30 });
  });
});

describe('résultat de la séance', () => {
  const session: PlannedSession = {
    id: 'p1-1',
    weekday: 0,
    title: 'Haut du corps',
    muscles: ['pecs', 'abdos'],
    exercises: PLAN,
    durationMin: 45,
    kcal: 290,
  };

  it('enregistre la durée réelle, les calories et seulement les séries faites', () => {
    let s = start();
    s = run(s, { type: 'complete', now: T0 }, { type: 'reps', delta: -2 }, { type: 'skip-rest' }, { type: 'complete', now: T0 });
    const log = buildSessionLog({ id: 'log1', program: { id: 'p1' }, session, state: s, endedAt: T0 + 46 * 60_000 });
    expect(log).toMatchObject({
      id: 'log1',
      programId: 'p1',
      sessionId: 'p1-1',
      title: 'Haut du corps',
      startedAt: T0,
      endedAt: T0 + 46 * 60_000,
      durationSec: 46 * 60,
      kcal: 290,
      completed: false,
    });
    expect(log.exercises).toEqual([
      {
        exerciseId: 'pompes',
        sets: [
          { target: 12, done: 10, failed: false },
          { target: 12, done: 12, failed: false },
        ],
      },
    ]);
  });

  it('marque la séance terminée quand toutes les séries sont faites', () => {
    let s = start();
    for (let i = 0; i < 6; i += 1) s = run(s, { type: 'complete', now: T0 }, { type: 'skip-rest' });
    expect(s.done).toBe(true);
    const log = buildSessionLog({ id: 'l', program: { id: 'p1' }, session, state: s, endedAt: T0 + 1000 });
    expect(log.completed).toBe(true);
    expect(log.durationSec).toBe(1);
  });

  it('compte les séries par muscle principal, dans l’ordre de la séance', () => {
    let s = start();
    for (let i = 0; i < 6; i += 1) s = run(s, { type: 'complete', now: T0 }, { type: 'skip-rest' });
    const log = buildSessionLog({ id: 'l', program: { id: 'p1' }, session, state: s, endedAt: T0 + 60_000 });
    expect(setsByMuscle(log)).toEqual([
      { muscle: 'pecs', sets: 3 },
      { muscle: 'abdos', sets: 3 },
    ]);
  });

  it('ajoute les muscles absents du titre de la séance à la suite', () => {
    const result = setsByMuscle({
      muscles: ['pecs'],
      exercises: [
        { exerciseId: 'squat', sets: [{ target: 12, done: 12, failed: false }] },
        { exerciseId: 'pompes', sets: [{ target: 12, done: 12, failed: false }] },
      ],
    });
    expect(result).toEqual([
      { muscle: 'pecs', sets: 1 },
      { muscle: 'jambes', sets: 1 },
    ]);
  });
});
