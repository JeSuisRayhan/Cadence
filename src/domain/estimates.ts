import { getExercise } from './catalog';
import type { PlannedExercise } from './types';

/** Durée moyenne d’une répétition contrôlée, en secondes. */
export const SECONDS_PER_REP = 4;
/** Temps de mise en place entre deux exercices, en secondes. */
export const TRANSITION_SEC = 30;
/** Dépense moyenne : environ 70 kg à 5,5 MET. */
export const KCAL_PER_MINUTE = 6.4;

/** Durée de travail d'une série, en secondes. */
export const setSeconds = (exercise: PlannedExercise): number => {
  const def = getExercise(exercise.exerciseId);
  return def.unit === 'sec' ? exercise.target : exercise.target * SECONDS_PER_REP;
};

/** Durée estimée d'une séance, en secondes. Le repos suit chaque série, sauf la toute dernière. */
export const estimateSeconds = (exercises: readonly PlannedExercise[]): number => {
  if (exercises.length === 0) return 0;
  let total = 0;
  for (const ex of exercises) {
    total += ex.sets * setSeconds(ex) + ex.sets * ex.restSec;
  }
  total -= exercises[exercises.length - 1].restSec;
  total += (exercises.length - 1) * TRANSITION_SEC;
  return total;
};

export const roundToFive = (minutes: number): number => Math.max(5, Math.round(minutes / 5) * 5);

/** Calories brûlées pour une durée donnée, arrondies à la dizaine. */
export const kcalForSeconds = (seconds: number): number =>
  Math.round(((seconds / 60) * KCAL_PER_MINUTE) / 10) * 10;
