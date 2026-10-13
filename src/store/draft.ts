import { create } from 'zustand';
import { MUSCLES } from '../domain/labels';
import type { Level, Muscle, Place, Weekday } from '../domain/types';

/** Brouillon du programme en cours de création : jamais sauvegardé. */
interface DraftState {
  perWeek: number;
  /** jours choisis, du plus ancien au plus récent clic */
  weekdays: Weekday[];
  level: Level;
  muscles: Muscle[];
  place: Place;
  durationMin: number;

  setPerWeek: (n: number) => void;
  toggleWeekday: (day: Weekday) => void;
  setLevel: (level: Level) => void;
  toggleMuscle: (muscle: Muscle) => void;
  toggleAllMuscles: () => void;
  setPlace: (place: Place) => void;
  setDuration: (minutes: number) => void;
  reset: () => void;
}

export const DURATION_MIN = 15;
export const DURATION_MAX = 90;
export const DURATION_STEP = 5;

const initial = {
  perWeek: 3,
  weekdays: [0, 2, 4] as Weekday[],
  level: 'inter' as Level,
  muscles: [] as Muscle[],
  place: 'maison' as Place,
  durationMin: 45,
};

export const useDraft = create<DraftState>()((set) => ({
  ...initial,

  setPerWeek: (n) => set((s) => ({ perWeek: n, weekdays: s.weekdays.slice(Math.max(0, s.weekdays.length - n)) })),

  toggleWeekday: (day) =>
    set((s) => {
      if (s.weekdays.includes(day)) return { weekdays: s.weekdays.filter((d) => d !== day) };
      // au-delà du nombre voulu, le jour choisi le plus ancien est retiré
      const next = [...s.weekdays, day];
      return { weekdays: next.length > s.perWeek ? next.slice(next.length - s.perWeek) : next };
    }),

  setLevel: (level) => set({ level }),

  toggleMuscle: (muscle) =>
    set((s) => ({
      muscles: s.muscles.includes(muscle) ? s.muscles.filter((m) => m !== muscle) : [...s.muscles, muscle],
    })),

  toggleAllMuscles: () =>
    set((s) => ({ muscles: s.muscles.length === MUSCLES.length ? [] : [...MUSCLES] })),

  setPlace: (place) => set({ place }),

  setDuration: (minutes) =>
    set({ durationMin: Math.min(DURATION_MAX, Math.max(DURATION_MIN, Math.round(minutes / DURATION_STEP) * DURATION_STEP)) }),

  reset: () => set({ ...initial, weekdays: [...initial.weekdays], muscles: [] }),
}));
