import { createProgram } from '../generator';
import {
  nextOccurrence,
  rankInWeek,
  relativeDayLabel,
  upcomingAfter,
  weekNumber,
  weekOf,
} from '../week';
import { formatClock, formatDateLong, formatTimer, startOfWeek, weekdayOf } from '../format';
import type { SessionLog, Weekday } from '../types';

// lundi 12 octobre 2026, 10 h
const monday = new Date(2026, 9, 12, 10, 0, 0);
const program = createProgram(
  {
    muscles: ['pecs', 'epaules', 'triceps', 'dos', 'biceps', 'jambes'],
    level: 'inter',
    place: 'maison',
    durationMin: 45,
    weekdays: [0, 2, 4] as Weekday[],
  },
  new Date(2026, 9, 1).getTime(),
  'prog',
);

const log = (sessionId: string, startedAt: Date): SessionLog => ({
  id: `log-${sessionId}-${startedAt.getTime()}`,
  programId: 'prog',
  sessionId,
  title: 'x',
  muscles: [],
  startedAt: startedAt.getTime(),
  endedAt: startedAt.getTime() + 45 * 60000,
  durationSec: 45 * 60,
  kcal: 290,
  exercises: [],
  completed: true,
});

describe('dates', () => {
  it('formate comme dans les maquettes', () => {
    expect(formatDateLong(monday)).toBe('Lundi 12 octobre');
    expect(weekdayOf(monday)).toBe(0);
    expect(weekdayOf(new Date(2026, 9, 18))).toBe(6);
    expect(formatClock(18 * 60 + 30)).toBe('18:30');
    expect(formatTimer(90)).toBe('01:30');
    expect(formatTimer(5)).toBe('00:05');
  });

  it('trouve le lundi de la semaine, même un dimanche', () => {
    expect(startOfWeek(new Date(2026, 9, 18, 23, 0)).getDate()).toBe(12);
    expect(startOfWeek(monday).getDate()).toBe(12);
  });
});

describe('semaine', () => {
  it('marque la séance du jour, les séances à venir et les jours de repos', () => {
    const week = weekOf(program, [], monday);
    expect(week.map((d) => d.state)).toEqual(['today', 'rest', 'upcoming', 'rest', 'upcoming', 'rest', 'rest']);
  });

  it('marque une séance faite, et une séance manquée', () => {
    const thursday = new Date(2026, 9, 15, 9, 0);
    const week = weekOf(program, [log(program.sessions[0].id, monday)], thursday);
    expect(week[0].state).toBe('done');
    expect(week[2].state).toBe('missed');
    expect(week[4].state).toBe('upcoming');
  });

  it('ignore les jours précédant la création du programme', () => {
    const created = createProgram(
      { muscles: ['pecs'], level: 'inter', place: 'maison', durationMin: 30, weekdays: [0, 2, 4] as Weekday[] },
      new Date(2026, 9, 14).getTime(),
      'late',
    );
    const week = weekOf(created, [], new Date(2026, 9, 14, 12));
    expect(week[0].state).toBe('rest');
    expect(week[2].state).toBe('today');
  });

  it('numérote les semaines depuis la création', () => {
    expect(weekNumber(program, new Date(2026, 9, 1))).toBe(1);
    expect(weekNumber(program, new Date(2026, 9, 12))).toBe(3);
  });
});

describe('prochaine séance', () => {
  it('propose la séance du jour, puis les suivantes', () => {
    const next = nextOccurrence(program, [], monday);
    expect(next?.session.weekday).toBe(0);
    expect(next?.offset).toBe(0);
    const after = upcomingAfter(program, [], monday, next!);
    expect(after.map((o) => o.session.weekday)).toEqual([2, 4, 0]);
    expect(rankInWeek(program, next!.session)).toEqual({ rank: 1, total: 3 });
  });

  it('passe à la séance suivante quand celle du jour est faite', () => {
    const next = nextOccurrence(program, [log(program.sessions[0].id, monday)], monday);
    expect(next?.session.weekday).toBe(2);
    expect(next?.offset).toBe(2);
  });

  it('passe à la semaine suivante après la dernière séance', () => {
    const friday = new Date(2026, 9, 16, 20, 0);
    const done = program.sessions.map((s, i) => log(s.id, new Date(2026, 9, 12 + i * 2, 18)));
    const next = nextOccurrence(program, done, friday);
    expect(next?.session.weekday).toBe(0);
    expect(next?.offset).toBe(3);
    expect(relativeDayLabel(next!.date, friday)).toBe('Lundi prochain');
  });

  it('étiquette les jours relatifs', () => {
    expect(relativeDayLabel(monday, monday)).toBe('Aujourd’hui');
    expect(relativeDayLabel(new Date(2026, 9, 13), monday)).toBe('Demain');
    expect(relativeDayLabel(new Date(2026, 9, 14), monday)).toBe('Mercredi');
  });
});
