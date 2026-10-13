import type { Weekday } from './types';
import { WEEKDAY_LONG } from './labels';

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/** 0 = lundi … 6 = dimanche */
export const weekdayOf = (date: Date): Weekday => ((date.getDay() + 6) % 7) as Weekday;

export const capitalize = (text: string): string => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

/** « Lundi 12 octobre » */
export const formatDateLong = (date: Date): string =>
  `${WEEKDAY_LONG[weekdayOf(date)]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;

/** « lundi 12 octobre » */
export const formatDateLongLower = (date: Date): string => formatDateLong(date).toLowerCase();

export const plural = (count: number, one: string, many: string): string => `${count} ${count > 1 ? many : one}`;

export const formatMinutes = (minutes: number): string => `${Math.round(minutes)} min`;

/** « 12 répétitions » ou, pour un exercice chronométré, « 30 secondes » */
export const formatTarget = (unit: 'reps' | 'sec', target: number): string =>
  unit === 'sec' ? plural(target, 'seconde', 'secondes') : plural(target, 'répétition', 'répétitions');

/** « 3 séries » */
export const formatSets = (count: number): string => plural(count, 'série', 'séries');

/** minutes depuis minuit → « 18:30 » */
export const formatClock = (minutesSinceMidnight: number): string => {
  const h = Math.floor(minutesSinceMidnight / 60) % 24;
  const m = minutesSinceMidnight % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** secondes → « 01:30 » */
export const formatTimer = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** secondes → « 3:12 » (durée d'un titre) */
export const formatTrackTime = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** secondes → « 1 min 30 » ou « 45 s » (texte d'aide) */
export const formatRest = (seconds: number): string => {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m} min ${String(s).padStart(2, '0')}`;
};

/** « ≈ 290 kcal » */
export const formatKcal = (kcal: number): string => `≈ ${Math.round(kcal)} kcal`;

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Lundi 00:00 de la semaine de `date` */
export const startOfWeek = (date: Date): Date => addDays(startOfDay(date), -weekdayOf(date));
