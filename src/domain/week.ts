import { addDays, startOfDay, startOfWeek, weekdayOf } from './format';
import { WEEKDAY_LONG, WEEKDAYS } from './labels';
import type { PlannedSession, Program, SessionLog, Weekday } from './types';

export type DayState = 'done' | 'today' | 'upcoming' | 'missed' | 'rest';

export interface WeekDay {
  weekday: Weekday;
  date: Date;
  session: PlannedSession | null;
  state: DayState;
}

export interface Occurrence {
  session: PlannedSession;
  date: Date;
  /** nombre de jours depuis aujourd'hui */
  offset: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Une séance est faite dès qu'elle a été enregistrée pendant la semaine de `now`. */
export const isDoneThisWeek = (
  history: readonly SessionLog[],
  program: Program,
  session: PlannedSession,
  now: Date,
): boolean => {
  const from = startOfWeek(now).getTime();
  const to = from + WEEK_MS;
  return history.some(
    (log) => log.programId === program.id && log.sessionId === session.id && log.startedAt >= from && log.startedAt < to,
  );
};

/** Les sept jours de la semaine en cours (lundi → dimanche), avec l'état de chacun. */
export const weekOf = (program: Program, history: readonly SessionLog[], now: Date): WeekDay[] => {
  const monday = startOfWeek(now);
  const today = weekdayOf(now);
  const created = startOfDay(new Date(program.createdAt)).getTime();

  return WEEKDAYS.map((weekday) => {
    const date = addDays(monday, weekday);
    const session = program.sessions.find((s) => s.weekday === weekday) ?? null;
    let state: DayState = 'rest';
    if (session) {
      if (isDoneThisWeek(history, program, session, now)) state = 'done';
      else if (date.getTime() < created) state = 'rest';
      else if (weekday === today) state = 'today';
      else if (weekday > today) state = 'upcoming';
      else state = 'missed';
    }
    return { weekday, date, session, state };
  });
};

/** Numéro de la semaine depuis la création du programme (1 la première semaine). */
export const weekNumber = (program: Program, now: Date): number => {
  const diff = startOfWeek(now).getTime() - startOfWeek(new Date(program.createdAt)).getTime();
  return Math.max(1, Math.round(diff / WEEK_MS) + 1);
};

/** Prochaines séances à partir de `from` (inclus), en sautant celles déjà faites cette semaine. */
export const occurrencesFrom = (
  program: Program,
  history: readonly SessionLog[],
  now: Date,
  from: Date,
  limit: number,
  horizonDays = 14,
): Occurrence[] => {
  const today = startOfDay(now);
  const start = startOfDay(from);
  const out: Occurrence[] = [];
  for (let i = 0; i < horizonDays && out.length < limit; i += 1) {
    const date = addDays(start, i);
    const session = program.sessions.find((s) => s.weekday === weekdayOf(date));
    if (!session) continue;
    const inCurrentWeek = startOfWeek(date).getTime() === startOfWeek(now).getTime();
    if (inCurrentWeek && isDoneThisWeek(history, program, session, now)) continue;
    const offset = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    out.push({ session, date, offset });
  }
  return out;
};

/** La séance à proposer en premier : celle du jour si elle reste à faire, sinon la suivante. */
export const nextOccurrence = (program: Program, history: readonly SessionLog[], now: Date): Occurrence | null =>
  occurrencesFrom(program, history, now, now, 1)[0] ?? null;

/** Les séances qui suivent la séance mise en avant. */
export const upcomingAfter = (
  program: Program,
  history: readonly SessionLog[],
  now: Date,
  featured: Occurrence,
  limit = 3,
): Occurrence[] => occurrencesFrom(program, history, now, addDays(featured.date, 1), limit);

/** « Aujourd’hui », « Demain », « Mercredi » ou « Lundi prochain » */
export const relativeDayLabel = (date: Date, now: Date): string => {
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Aujourd’hui';
  if (days === 1) return 'Demain';
  const name = WEEKDAY_LONG[weekdayOf(date)];
  return startOfWeek(date).getTime() === startOfWeek(now).getTime() ? name : `${name} prochain`;
};

/** « Séance 2 sur 3 cette semaine » : rang de la séance parmi celles de la semaine. */
export const rankInWeek = (program: Program, session: PlannedSession): { rank: number; total: number } => ({
  rank: program.sessions.findIndex((s) => s.id === session.id) + 1,
  total: program.sessions.length,
});
