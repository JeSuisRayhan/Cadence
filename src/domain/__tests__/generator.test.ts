import { EXERCISES, getExercise } from '../catalog';
import { estimateSeconds, kcalForSeconds } from '../estimates';
import { createProgram, generateSessions, previewSession, sessionTitle, splitGroups } from '../generator';
import type { Muscle, Weekday } from '../types';

const days = (...d: number[]) => d as Weekday[];

describe('catalogue', () => {
  it('référence uniquement des illustrations existantes et des identifiants uniques', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of EXERCISES) {
      expect(e.muscles.length).toBeGreaterThan(0);
      expect(e.muscles.length).toBeLessThanOrEqual(2);
    }
  });

  it('renvoie un exercice neutre pour un identifiant inconnu', () => {
    expect(getExercise('nimporte-quoi').name).toBe('Exercice');
  });
});

describe('estimations', () => {
  it('compte le repos après chaque série sauf la dernière', () => {
    const seconds = estimateSeconds([
      { exerciseId: 'pompes', sets: 3, target: 10, restSec: 60 },
    ]);
    // 3 séries de 40 s + 2 repos de 60 s
    expect(seconds).toBe(3 * 40 + 3 * 60 - 60);
  });

  it('arrondit les calories à la dizaine', () => {
    expect(kcalForSeconds(45 * 60)).toBe(290);
    expect(kcalForSeconds(46 * 60)).toBe(290);
    expect(kcalForSeconds(0)).toBe(0);
  });
});

describe('titres de séance', () => {
  it('nomme les séances comme dans les maquettes', () => {
    expect(sessionTitle(['pecs', 'epaules', 'triceps'])).toBe('Haut du corps');
    expect(sessionTitle(['dos', 'biceps'])).toBe('Dos et biceps');
    expect(sessionTitle(['jambes'])).toBe('Jambes');
    expect(sessionTitle(['jambes', 'fessiers', 'abdos'])).toBe('Jambes et fessiers');
    expect(sessionTitle(['abdos'])).toBe('Abdos');
    expect(sessionTitle(['pecs', 'jambes', 'dos'])).toBe('Corps entier');
  });
});

describe('répartition des muscles', () => {
  it('range les muscles par groupes', () => {
    expect(splitGroups(['triceps', 'pecs', 'dos', 'jambes'])).toEqual([['pecs', 'triceps'], ['dos'], ['jambes']]);
    expect(splitGroups(['abdos'])).toEqual([]);
  });
});

describe('génération du programme', () => {
  const all: Muscle[] = ['pecs', 'dos', 'epaules', 'biceps', 'triceps', 'abdos', 'jambes', 'fessiers'];

  it('crée une séance par jour, dans l’ordre des jours', () => {
    const sessions = generateSessions(
      { muscles: all, level: 'inter', place: 'maison', durationMin: 45, weekdays: days(4, 0, 2) },
      'p1',
    );
    expect(sessions.map((s) => s.weekday)).toEqual([0, 2, 4]);
    expect(sessions.map((s) => s.title)).toEqual(['Haut du corps', 'Dos et biceps', 'Jambes et fessiers']);
    expect(new Set(sessions.map((s) => s.id)).size).toBe(3);
  });

  it('colle à la durée demandée (à une série près)', () => {
    for (const durationMin of [30, 45, 60, 75, 90]) {
      const [session] = generateSessions(
        { muscles: all, level: 'inter', place: 'salle', durationMin, weekdays: days(0) },
        'p',
      );
      const minutes = estimateSeconds(session.exercises) / 60;
      expect(Math.abs(minutes - durationMin)).toBeLessThan(3);
      expect(session.exercises.length).toBeGreaterThanOrEqual(3);
      expect(session.exercises.length).toBeLessThanOrEqual(12);
    }
  });

  it('affiche exactement la durée choisie quand le catalogue le permet', () => {
    for (const level of ['debutant', 'inter', 'avance'] as const) {
      for (const place of ['maison', 'salle'] as const) {
        for (const durationMin of [30, 45, 60]) {
          const sessions = generateSessions(
            { muscles: all, level, place, durationMin, weekdays: days(0, 2, 4) },
            'p',
          );
          expect(sessions.map((s) => s.durationMin)).toEqual([durationMin, durationMin, durationMin]);
        }
      }
    }
  });

  it('regroupe les exercices par muscle, dans l’ordre des muscles', () => {
    const order: Muscle[] = ['pecs', 'epaules', 'triceps'];
    for (const level of ['debutant', 'inter', 'avance'] as const) {
      const [session] = generateSessions(
        { muscles: order, level, place: 'maison', durationMin: 45, weekdays: days(0) },
        'p',
      );
      const ranks = session.exercises.map((e) => order.indexOf(getExercise(e.exerciseId).muscles[0]));
      expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    }
  });

  it('calcule les calories sur la durée affichée', () => {
    const [session] = generateSessions(
      { muscles: all, level: 'inter', place: 'maison', durationMin: 45, weekdays: days(0) },
      'p',
    );
    expect(session.kcal).toBe(kcalForSeconds(session.durationMin * 60));
  });

  it('garde entre 2 et 5 séries par exercice', () => {
    for (const durationMin of [20, 45, 90]) {
      const sessions = generateSessions(
        { muscles: all, level: 'inter', place: 'maison', durationMin, weekdays: days(0, 2, 4) },
        'p',
      );
      for (const exercise of sessions.flatMap((s) => s.exercises)) {
        expect(exercise.sets).toBeGreaterThanOrEqual(2);
        expect(exercise.sets).toBeLessThanOrEqual(5);
      }
    }
  });

  it('propose environ six exercices pour 45 min en niveau intermédiaire', () => {
    const [session] = generateSessions(
      { muscles: ['pecs', 'epaules', 'triceps'], level: 'inter', place: 'maison', durationMin: 45, weekdays: days(0) },
      'p',
    );
    expect(session.exercises.length).toBeGreaterThanOrEqual(5);
    expect(session.exercises.length).toBeLessThanOrEqual(7);
    expect(session.kcal).toBeGreaterThanOrEqual(260);
    expect(session.kcal).toBeLessThanOrEqual(310);
  });

  it('respecte le lieu et le niveau', () => {
    const home = generateSessions(
      { muscles: all, level: 'debutant', place: 'maison', durationMin: 60, weekdays: days(0, 2, 4) },
      'p',
    );
    for (const s of home) {
      for (const ex of s.exercises) {
        const def = getExercise(ex.exerciseId);
        expect(def.places).toContain('maison');
        expect(def.minLevel).toBe(0);
      }
    }
    const gym = generateSessions(
      { muscles: ['dos'], level: 'avance', place: 'salle', durationMin: 45, weekdays: days(1) },
      'p',
    );
    expect(gym[0].exercises.some((e) => e.exerciseId === 'pullup')).toBe(true);
  });

  it('place les exercices polyarticulaires avant les exercices d’isolation et les abdos à la fin', () => {
    const [session] = generateSessions(
      { muscles: ['pecs', 'biceps', 'abdos'], level: 'inter', place: 'maison', durationMin: 45, weekdays: days(0) },
      'p',
    );
    const last = getExercise(session.exercises[session.exercises.length - 1].exerciseId);
    expect(last.muscles[0]).toBe('abdos');
  });

  it('évite de répéter la même illustration quand le catalogue le permet', () => {
    const [session] = generateSessions(
      { muscles: ['pecs', 'epaules', 'triceps'], level: 'inter', place: 'maison', durationMin: 45, weekdays: days(0) },
      'p',
    );
    const images = session.exercises.map((e) => getExercise(e.exerciseId).image);
    expect(new Set(images).size).toBe(images.length);
  });

  it('varie les exercices quand un même groupe revient dans la semaine', () => {
    const sessions = generateSessions(
      { muscles: ['pecs', 'triceps'], level: 'inter', place: 'maison', durationMin: 30, weekdays: days(0, 2, 4) },
      'p',
    );
    const first = sessions[0].exercises.map((e) => e.exerciseId).join(',');
    const second = sessions[1].exercises.map((e) => e.exerciseId).join(',');
    expect(first).not.toBe(second);
  });

  it('gère les séances d’abdos seuls et les séries supplémentaires', () => {
    const [session] = generateSessions(
      { muscles: ['abdos'], level: 'avance', place: 'maison', durationMin: 45, weekdays: days(5) },
      'p',
    );
    expect(session.title).toBe('Abdos');
    expect(session.exercises.every((e) => getExercise(e.exerciseId).muscles[0] === 'abdos')).toBe(true);
    expect(session.exercises.every((e) => e.sets <= 5)).toBe(true);
  });

  it('fusionne les groupes quand il y a moins de séances que de groupes', () => {
    const one = generateSessions(
      { muscles: all, level: 'inter', place: 'maison', durationMin: 60, weekdays: days(2) },
      'p',
    );
    expect(one).toHaveLength(1);
    expect(one[0].title).toBe('Corps entier');
    const two = generateSessions(
      { muscles: all, level: 'inter', place: 'maison', durationMin: 60, weekdays: days(1, 4) },
      'p',
    );
    expect(two.map((s) => s.title)).toEqual(['Haut du corps', 'Jambes et fessiers']);
  });

  it('crée un programme complet', () => {
    const program = createProgram(
      { muscles: all, level: 'debutant', place: 'salle', durationMin: 45, weekdays: days(4, 0) },
      1000,
      'abc',
    );
    expect(program.id).toBe('abc');
    expect(program.weekdays).toEqual([0, 4]);
    expect(program.sessions).toHaveLength(2);
  });

  it('donne un aperçu pour l’écran de durée', () => {
    const preview = previewSession({
      muscles: ['pecs', 'epaules', 'triceps'],
      level: 'inter',
      place: 'maison',
      durationMin: 45,
      weekdays: days(0, 2, 4),
    });
    expect(preview.exercises).toBeGreaterThanOrEqual(5);
    expect(preview.kcal).toBeGreaterThan(0);
  });
});
