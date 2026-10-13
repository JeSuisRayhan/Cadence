export type Muscle = 'pecs' | 'dos' | 'epaules' | 'biceps' | 'triceps' | 'abdos' | 'jambes' | 'fessiers';
export type Level = 'debutant' | 'inter' | 'avance';
export type Place = 'maison' | 'salle';
/** 0 = lundi … 6 = dimanche */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  /** répétitions, ou secondes si l'exercice est chronométré */
  target: number;
  restSec: number;
}

export interface PlannedSession {
  id: string;
  weekday: Weekday;
  title: string;
  muscles: Muscle[];
  exercises: PlannedExercise[];
  /** durée estimée, en minutes (arrondie à 5) */
  durationMin: number;
  kcal: number;
}

export interface Program {
  id: string;
  createdAt: number;
  level: Level;
  place: Place;
  muscles: Muscle[];
  /** durée demandée par la personne, en minutes */
  durationMin: number;
  weekdays: Weekday[];
  sessions: PlannedSession[];
}

export interface SetLog {
  target: number;
  /** répétitions réellement faites ; null si non renseigné */
  done: number | null;
  failed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface SessionLog {
  id: string;
  programId: string;
  sessionId: string;
  title: string;
  muscles: Muscle[];
  startedAt: number;
  endedAt: number;
  durationSec: number;
  kcal: number;
  exercises: ExerciseLog[];
  /** vrai si toutes les séries prévues ont été faites */
  completed: boolean;
}
