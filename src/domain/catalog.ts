import type { ExerciseImageKey } from '../assets/images';
import type { Muscle, Place } from './types';

export interface ExerciseDef {
  id: string;
  name: string;
  image: ExerciseImageKey;
  /** muscles travaillés (2 au maximum) : le premier est le principal */
  muscles: readonly [Muscle] | readonly [Muscle, Muscle];
  places: readonly Place[];
  /** 0 = débutant, 1 = intermédiaire, 2 = avancé */
  minLevel: 0 | 1 | 2;
  /** exercice polyarticulaire : placé en premier dans la séance */
  compound: boolean;
  /** `sec` : exercice chronométré (la cible est en secondes) */
  unit: 'reps' | 'sec';
  /** cible par niveau, quand elle diffère de la valeur par défaut */
  targetByLevel?: readonly [number, number, number];
  /** demande des haltères ou une barre : écarté quand la personne n'a pas de poids à la maison */
  weights: boolean;
}

const BOTH: readonly Place[] = ['maison', 'salle'];
const HOME: readonly Place[] = ['maison'];
const GYM: readonly Place[] = ['salle'];

type Options = Partial<Pick<ExerciseDef, 'places' | 'minLevel' | 'compound' | 'unit' | 'targetByLevel' | 'weights'>>;

const def = (
  id: string,
  name: string,
  image: ExerciseImageKey,
  muscles: ExerciseDef['muscles'],
  options: Options = {},
): ExerciseDef => ({
  id,
  name,
  image,
  muscles,
  places: options.places ?? BOTH,
  minLevel: options.minLevel ?? 0,
  compound: options.compound ?? false,
  unit: options.unit ?? 'reps',
  targetByLevel: options.targetByLevel,
  weights: options.weights ?? false,
});

/**
 * Catalogue d'exercices. L'ordre compte : à muscle égal, les premiers sont proposés en premier.
 * Les variantes réutilisent l'illustration de l'exercice dont elles dérivent.
 * `weights` marque ceux qui demandent des haltères ou une barre ; les exercices « maison » sans poids existent pour tous les muscles,
 * afin qu'un programme sans matériel reste complet.
 */
export const EXERCISES: readonly ExerciseDef[] = [
  // pecs
  def('pompes', 'Pompes', 'pompes', ['pecs', 'triceps'], { compound: true }),
  def('floorpress', 'Développé au sol', 'floorpress', ['pecs', 'triceps'], { places: HOME, compound: true, weights: true }),
  def('benchpress', 'Développé couché', 'benchpress', ['pecs', 'triceps'], { places: GYM, compound: true, weights: true }),
  def('pompes-inclinees', 'Pompes inclinées', 'pompes', ['pecs', 'epaules'], { compound: true }),
  def('pompes-serrees', 'Pompes serrées', 'pompes', ['pecs', 'triceps'], { minLevel: 1, compound: true }),
  def('pompes-lentes', 'Pompes lentes', 'pompes', ['pecs', 'epaules'], {
    minLevel: 1,
    compound: true,
    targetByLevel: [8, 8, 10],
  }),

  // dos
  def('rowing', 'Rowing haltère', 'rowing', ['dos', 'biceps'], { compound: true, weights: true }),
  def('pullup', 'Tractions', 'pullup', ['dos', 'biceps'], {
    places: GYM,
    minLevel: 1,
    compound: true,
    targetByLevel: [6, 8, 10],
  }),
  def('superman', 'Superman', 'superman', ['dos', 'fessiers'], { targetByLevel: [12, 15, 15] }),
  def('rowing-penche', 'Rowing buste penché', 'rowing', ['dos', 'biceps'], { compound: true, weights: true }),
  def('superman-alterne', 'Superman alterné', 'superman', ['dos', 'fessiers'], { targetByLevel: [12, 14, 16] }),
  def('anges-inverses', 'Anges inversés', 'superman', ['dos', 'epaules'], { places: HOME, targetByLevel: [10, 12, 15] }),
  def('rowing-table', 'Rowing sous une table', 'pullup', ['dos', 'biceps'], {
    places: HOME,
    minLevel: 1,
    compound: true,
    targetByLevel: [8, 10, 12],
  }),

  // biceps
  def('curl', 'Curl biceps', 'curl', ['biceps'], { weights: true }),
  def('curl-marteau', 'Curl marteau', 'curl', ['biceps'], { weights: true }),
  def('curl-concentre', 'Curl concentré', 'curl', ['biceps'], { weights: true }),
  def('curl-serviette', 'Curl avec serviette', 'curl', ['biceps'], { places: HOME }),
  def('curl-serviette-tenue', 'Curl serviette en tenue', 'curl', ['biceps'], { places: HOME, unit: 'sec', targetByLevel: [20, 30, 40] }),

  // triceps
  def('dips', 'Dips sur chaise', 'dips', ['triceps', 'pecs'], { compound: true }),
  def('tricepsext', 'Extension triceps', 'tricepsext', ['triceps'], { weights: true }),
  def('kickback', 'Kickback triceps', 'kickback', ['triceps'], { weights: true }),
  def('extension-chaise', 'Extensions triceps sur chaise', 'dips', ['triceps'], { places: HOME }),
  def('pompes-diamant', 'Pompes diamant', 'pompes', ['triceps', 'pecs'], {
    places: HOME,
    minLevel: 1,
    compound: true,
    targetByLevel: [8, 10, 12],
  }),

  // épaules
  def('militaire', 'Développé militaire', 'militaire', ['epaules', 'triceps'], { compound: true, weights: true }),
  def('elevations', 'Élévations latérales', 'elevations', ['epaules'], { weights: true }),
  def('arnold', 'Développé Arnold', 'militaire', ['epaules', 'triceps'], { minLevel: 1, compound: true, weights: true }),
  def('elevations-avant', 'Élévations frontales', 'elevations', ['epaules'], { weights: true }),
  def('pompes-pike', 'Pompes pike', 'pompes', ['epaules', 'triceps'], { places: HOME, compound: true, targetByLevel: [6, 10, 12] }),
  def('bras-croix', 'Bras en croix', 'elevations', ['epaules'], { places: HOME, unit: 'sec', targetByLevel: [20, 30, 45] }),
  def('touches-epaule', 'Planche, touches d’épaule', 'pompes', ['epaules', 'abdos'], { places: HOME, targetByLevel: [12, 16, 20] }),

  // abdos
  def('crunch', 'Crunch', 'crunch', ['abdos'], { targetByLevel: [15, 20, 20] }),
  def('planche', 'Planche', 'planche', ['abdos'], { unit: 'sec', targetByLevel: [20, 30, 45] }),
  def('releves', 'Relevés de jambes', 'releves', ['abdos'], { targetByLevel: [10, 12, 15] }),

  // jambes
  def('squat', 'Squat', 'squat', ['jambes', 'fessiers'], { compound: true }),
  def('fentes', 'Fentes', 'fentes', ['jambes', 'fessiers'], { compound: true }),
  def('mollets', 'Mollets debout', 'mollets', ['jambes'], { targetByLevel: [15, 15, 20] }),
  def('squat-sumo', 'Squat sumo', 'squat', ['jambes', 'fessiers'], { compound: true }),
  def('fentes-marchees', 'Fentes marchées', 'fentes', ['jambes', 'fessiers'], { minLevel: 1, compound: true }),

  // fessiers
  def('pont', 'Pont fessier', 'pont', ['fessiers', 'jambes'], { targetByLevel: [12, 15, 15] }),
  def('souleve', 'Soulevé de terre roumain', 'souleve', ['fessiers', 'jambes'], { compound: true, weights: true }),
  def('pont-lent', 'Pont fessier lent', 'pont', ['fessiers', 'jambes'], { minLevel: 1, targetByLevel: [10, 12, 12] }),
  def('donkey', 'Donkey kicks', 'pont', ['fessiers', 'jambes'], { places: HOME, targetByLevel: [12, 15, 15] }),
  def('pont-une-jambe', 'Pont fessier une jambe', 'pont', ['fessiers', 'jambes'], { places: HOME, minLevel: 1, targetByLevel: [8, 10, 12] }),
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

const FALLBACK: ExerciseDef = def('inconnu', 'Exercice', 'pompes', ['pecs']);

/** Renvoie l'exercice, ou un exercice neutre si un ancien programme référence un identifiant disparu. */
export const getExercise = (id: string): ExerciseDef => BY_ID.get(id) ?? FALLBACK;
