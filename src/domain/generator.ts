import { EXERCISES, getExercise, type ExerciseDef } from './catalog';
import { estimateSeconds, kcalForSeconds, roundToFive, TRANSITION_SEC } from './estimates';
import { levelIndex, MUSCLE_LABEL } from './labels';
import { uid } from './id';
import type { Level, Muscle, Place, PlannedExercise, PlannedSession, Program, Weekday } from './types';

export interface ProgramInput {
  muscles: readonly Muscle[];
  level: Level;
  place: Place;
  /** durée demandée, en minutes */
  durationMin: number;
  /** jours d'entraînement, triés */
  weekdays: readonly Weekday[];
}

const PUSH: readonly Muscle[] = ['pecs', 'epaules', 'triceps'];
const PULL: readonly Muscle[] = ['dos', 'biceps'];
const LEGS: readonly Muscle[] = ['jambes', 'fessiers'];
const UPPER: ReadonlySet<Muscle> = new Set<Muscle>(['pecs', 'dos', 'epaules', 'biceps', 'triceps']);

export const MIN_EXERCISES = 3;
export const MAX_EXERCISES = 12;
const MIN_SETS = 2;
const MAX_SETS = 5;

const SETS_BY_LEVEL = [3, 3, 4] as const;
const REST_BY_LEVEL = [75, 90, 90] as const;
const COMPOUND_TARGET = [10, 12, 8] as const;
const ISOLATION_TARGET = [12, 12, 12] as const;
const TIMED_REST = 60;

/** Titre d'une séance d'après les muscles travaillés (les abdos ne comptent pas : ils sont en fin de séance). */
export const sessionTitle = (muscles: readonly Muscle[]): string => {
  const main = muscles.filter((m) => m !== 'abdos');
  if (main.length === 0) return MUSCLE_LABEL.abdos;
  if (main.length === 1) return MUSCLE_LABEL[main[0]];
  if (main.length === 2) return `${MUSCLE_LABEL[main[0]]} et ${MUSCLE_LABEL[main[1]].toLowerCase()}`;
  return main.every((m) => UPPER.has(m)) ? 'Haut du corps' : 'Corps entier';
};

/** Répartit les muscles choisis en groupes cohérents : poussée, tirage, jambes. */
export const splitGroups = (muscles: readonly Muscle[]): Muscle[][] => {
  const selected = new Set(muscles);
  return [PUSH, PULL, LEGS].map((group) => group.filter((m) => selected.has(m))).filter((group) => group.length > 0);
};

/** Un groupe de muscles par séance de la semaine. */
const assignGroups = (groups: Muscle[][], sessions: number): Muscle[][] => {
  const count = groups.length;
  if (sessions >= count) return Array.from({ length: sessions }, (_, i) => groups[i % count]);
  if (sessions === 1) return [groups.flat()];
  // deux séances pour trois groupes : haut du corps / jambes
  return [[...groups[0], ...groups[1]], groups[2]];
};

const rotate = <T>(list: readonly T[], by: number): T[] => {
  if (list.length === 0) return [];
  const n = ((by % list.length) + list.length) % list.length;
  return [...list.slice(n), ...list.slice(0, n)];
};

const plan = (def: ExerciseDef, level: Level): PlannedExercise => {
  const lvl = levelIndex(level);
  const target =
    def.targetByLevel?.[lvl] ?? (def.compound ? COMPOUND_TARGET[lvl] : ISOLATION_TARGET[lvl]);
  return {
    exerciseId: def.id,
    sets: SETS_BY_LEVEL[lvl],
    target,
    restSec: def.unit === 'sec' ? TIMED_REST : REST_BY_LEVEL[lvl],
  };
};

/** Exercices candidats pour un muscle : polyarticulaires d'abord, variés d'une semaine à l'autre. */
const candidatesFor = (muscle: Muscle, level: Level, place: Place, pass: number): ExerciseDef[] => {
  const lvl = levelIndex(level);
  const pool = EXERCISES.filter((e) => e.places.includes(place) && e.minLevel <= lvl && e.muscles[0] === muscle);
  return [...rotate(pool.filter((e) => e.compound), pass), ...rotate(pool.filter((e) => !e.compound), pass)];
};

/** Alterne les muscles : un exercice de chacun à tour de rôle. */
const interleave = (lists: ExerciseDef[][]): ExerciseDef[] => {
  const out: ExerciseDef[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let round = 0; round < longest; round += 1) {
    for (const list of lists) {
      if (round < list.length) out.push(list[round]);
    }
  }
  return out;
};

/** Les exercices avec une illustration encore inutilisée passent avant les variantes. */
const preferDistinctImages = (queue: ExerciseDef[]): ExerciseDef[] => {
  const seen = new Set<string>();
  const first: ExerciseDef[] = [];
  const rest: ExerciseDef[] = [];
  for (const def of queue) {
    if (seen.has(def.image)) {
      rest.push(def);
    } else {
      seen.add(def.image);
      first.push(def);
    }
  }
  return [...first, ...rest];
};

const distance = (seconds: number, target: number): number => Math.abs(seconds - target);

/** Ajoute des exercices tant que cela rapproche de la durée demandée. */
const fill = (queue: ExerciseDef[], level: Level, targetSec: number, max: number): PlannedExercise[] => {
  const list: PlannedExercise[] = [];
  for (const def of queue) {
    if (list.length >= max) break;
    const next = [...list, plan(def, level)];
    if (list.length < MIN_EXERCISES || distance(estimateSeconds(next), targetSec) < distance(estimateSeconds(list), targetSec)) {
      list.push(next[next.length - 1]);
    } else {
      break; // l'exercice suivant éloignerait de la durée demandée : la séance est complète
    }
  }
  return list;
};

/**
 * Ajuste le nombre de séries pour tomber sur la durée demandée : une série de plus aux premiers exercices (les plus
 * importants) si la séance est trop courte, une de moins aux derniers si elle est trop longue.
 * Seuls les `adjustable` premiers exercices bougent ; chaque changement rapproche de la cible, donc la boucle s'arrête.
 */
const tune = (list: PlannedExercise[], targetSec: number, adjustable: number): void => {
  let progress = true;
  while (progress) {
    progress = false;
    const tooShort = estimateSeconds(list) < targetSec;
    const order = Array.from({ length: adjustable }, (_, i) => (tooShort ? i : adjustable - 1 - i));
    for (const i of order) {
      const ex = list[i];
      const delta = estimateSeconds(list) < targetSec ? 1 : -1;
      const sets = ex.sets + delta;
      if (sets < MIN_SETS || sets > MAX_SETS) continue;
      const before = distance(estimateSeconds(list), targetSec);
      ex.sets = sets;
      if (distance(estimateSeconds(list), targetSec) < before) {
        progress = true;
      } else {
        ex.sets -= delta;
      }
    }
  }
};

interface SessionPlanInput {
  muscles: Muscle[];
  level: Level;
  place: Place;
  durationMin: number;
  /** l'exercice d'abdos ajouté en fin de séance, s'il y en a un */
  withCore: boolean;
  pass: number;
}

const buildExercises = ({ muscles, level, place, durationMin, withCore, pass }: SessionPlanInput): PlannedExercise[] => {
  const totalSec = durationMin * 60;
  let targetSec = totalSec;

  let finisher: PlannedExercise | null = null;
  if (withCore) {
    const core = candidatesFor('abdos', level, place, pass)[0];
    if (core) {
      finisher = plan(core, level);
      targetSec -= estimateSeconds([finisher]) + finisher.restSec + TRANSITION_SEC;
    }
  }

  const lists = muscles.map((m) => candidatesFor(m, level, place, pass));
  const queue = preferDistinctImages(interleave(lists));
  const list = fill(queue, level, Math.max(targetSec, 0), MAX_EXERCISES - (finisher ? 1 : 0));
  // tous les exercices d'un muscle à la suite, dans l'ordre des muscles de la séance (les polyarticulaires d'abord)
  const order = (exercise: PlannedExercise) => muscles.indexOf(getExercise(exercise.exerciseId).muscles[0]);
  list.sort((a, b) => order(a) - order(b));
  const adjustable = list.length;
  if (finisher) list.push(finisher);
  tune(list, totalSec, adjustable);
  return list;
};

/**
 * Construit les séances d'une semaine : une par jour choisi, dans l'ordre des jours.
 * Même programme chaque semaine ; seules les séances d'un même groupe varient d'un passage à l'autre.
 */
export const generateSessions = (input: ProgramInput, programId: string): PlannedSession[] => {
  const { level, place, durationMin } = input;
  const weekdays = [...input.weekdays].sort((a, b) => a - b);
  const wantsCore = input.muscles.includes('abdos');
  const groups = splitGroups(input.muscles);

  const buckets: Muscle[][] = groups.length === 0 ? weekdays.map(() => ['abdos' as Muscle]) : assignGroups(groups, weekdays.length);
  const passes = groups.length === 0 ? weekdays.map((_, i) => i) : weekdays.map((_, i) => (weekdays.length >= groups.length ? Math.floor(i / groups.length) : 0));

  return weekdays.map((weekday, i) => {
    const muscles = buckets[i];
    const exercises = buildExercises({
      muscles,
      level,
      place,
      durationMin,
      withCore: wantsCore && groups.length > 0,
      pass: passes[i],
    });
    const minutes = roundToFive(estimateSeconds(exercises) / 60);
    const sessionMuscles = wantsCore && !muscles.includes('abdos') ? [...muscles, 'abdos' as Muscle] : muscles;
    return {
      id: `${programId}-${i + 1}`,
      weekday,
      title: sessionTitle(sessionMuscles),
      muscles: sessionMuscles,
      exercises,
      durationMin: minutes,
      kcal: kcalForSeconds(minutes * 60),
    };
  });
};

export const createProgram = (input: ProgramInput, now: number = Date.now(), id: string = uid()): Program => ({
  id,
  createdAt: now,
  level: input.level,
  place: input.place,
  muscles: [...input.muscles],
  durationMin: input.durationMin,
  weekdays: [...input.weekdays].sort((a, b) => a - b),
  sessions: generateSessions(input, id),
});

/** Aperçu pour l'écran de durée : nombre d'exercices et calories de la première séance. */
export const previewSession = (input: ProgramInput): { exercises: number; kcal: number; durationMin: number } => {
  const [first] = generateSessions(input, 'apercu');
  return first
    ? { exercises: first.exercises.length, kcal: first.kcal, durationMin: first.durationMin }
    : { exercises: 0, kcal: 0, durationMin: 0 };
};

export { getExercise };
