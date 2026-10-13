import type { Level, Muscle, Place, Weekday } from './types';

export const MUSCLES: readonly Muscle[] = ['pecs', 'dos', 'epaules', 'biceps', 'triceps', 'abdos', 'jambes', 'fessiers'];

export const MUSCLE_LABEL: Record<Muscle, string> = {
  pecs: 'Pecs',
  dos: 'Dos',
  epaules: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abdos: 'Abdos',
  jambes: 'Jambes',
  fessiers: 'Fessiers',
};

export const LEVELS: readonly Level[] = ['debutant', 'inter', 'avance'];

export const LEVEL_LABEL: Record<Level, string> = {
  debutant: 'Débutant',
  inter: 'Intermédiaire',
  avance: 'Avancé',
};

export const LEVEL_HINT: Record<Level, string> = {
  debutant: 'Je commence ou je reprends après une pause.',
  inter: 'Je m’entraîne régulièrement depuis quelques mois.',
  avance: 'Je m’entraîne depuis des années et je veux de l’intensité.',
};

export const levelIndex = (level: Level): 0 | 1 | 2 => (level === 'debutant' ? 0 : level === 'inter' ? 1 : 2);

export const PLACES: readonly Place[] = ['maison', 'salle'];

export const PLACE_LABEL: Record<Place, string> = {
  maison: 'Maison',
  salle: 'Salle',
};

/** « Maison », ou « Maison sans poids » quand la personne n'a pas de poids chez elle. */
export const placeLabel = (place: Place, noWeights = false): string =>
  place === 'maison' && noWeights ? 'Maison sans poids' : PLACE_LABEL[place];

export const WEEKDAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export const WEEKDAY_LONG: Record<Weekday, string> = {
  0: 'Lundi',
  1: 'Mardi',
  2: 'Mercredi',
  3: 'Jeudi',
  4: 'Vendredi',
  5: 'Samedi',
  6: 'Dimanche',
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: 'Lun',
  1: 'Mar',
  2: 'Mer',
  3: 'Jeu',
  4: 'Ven',
  5: 'Sam',
  6: 'Dim',
};

export const WEEKDAY_LETTER: Record<Weekday, string> = {
  0: 'L',
  1: 'M',
  2: 'M',
  3: 'J',
  4: 'V',
  5: 'S',
  6: 'D',
};

/** « Pecs · Épaules · Triceps » */
export const muscleDots = (muscles: readonly Muscle[]): string => muscles.map((m) => MUSCLE_LABEL[m]).join(' · ');

/** « pecs, épaules et triceps » */
export const muscleSentence = (muscles: readonly Muscle[]): string => {
  const names = muscles.map((m) => MUSCLE_LABEL[m].toLowerCase());
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
};
