/**
 * Toutes les images embarquées. Les `require` doivent rester statiques pour Metro.
 */

export const exerciseImages = {
  pompes: require('../../assets/images/exercises/pompes.jpg'),
  floorpress: require('../../assets/images/exercises/floorpress.jpg'),
  benchpress: require('../../assets/images/exercises/benchpress.jpg'),
  rowing: require('../../assets/images/exercises/rowing.jpg'),
  superman: require('../../assets/images/exercises/superman.jpg'),
  pullup: require('../../assets/images/exercises/pullup.jpg'),
  curl: require('../../assets/images/exercises/curl.jpg'),
  dips: require('../../assets/images/exercises/dips.jpg'),
  tricepsext: require('../../assets/images/exercises/tricepsext.jpg'),
  kickback: require('../../assets/images/exercises/kickback.jpg'),
  elevations: require('../../assets/images/exercises/elevations.jpg'),
  militaire: require('../../assets/images/exercises/militaire.jpg'),
  crunch: require('../../assets/images/exercises/crunch.jpg'),
  planche: require('../../assets/images/exercises/planche.jpg'),
  releves: require('../../assets/images/exercises/releves.jpg'),
  squat: require('../../assets/images/exercises/squat.jpg'),
  fentes: require('../../assets/images/exercises/fentes.jpg'),
  mollets: require('../../assets/images/exercises/mollets.jpg'),
  pont: require('../../assets/images/exercises/pont.jpg'),
  souleve: require('../../assets/images/exercises/souleve.jpg'),
} as const;

export type ExerciseImageKey = keyof typeof exerciseImages;

export const thumbImages: Record<ExerciseImageKey, number> = {
  pompes: require('../../assets/images/thumbs/pompes.jpg'),
  floorpress: require('../../assets/images/thumbs/floorpress.jpg'),
  benchpress: require('../../assets/images/thumbs/benchpress.jpg'),
  rowing: require('../../assets/images/thumbs/rowing.jpg'),
  superman: require('../../assets/images/thumbs/superman.jpg'),
  pullup: require('../../assets/images/thumbs/pullup.jpg'),
  curl: require('../../assets/images/thumbs/curl.jpg'),
  dips: require('../../assets/images/thumbs/dips.jpg'),
  tricepsext: require('../../assets/images/thumbs/tricepsext.jpg'),
  kickback: require('../../assets/images/thumbs/kickback.jpg'),
  elevations: require('../../assets/images/thumbs/elevations.jpg'),
  militaire: require('../../assets/images/thumbs/militaire.jpg'),
  crunch: require('../../assets/images/thumbs/crunch.jpg'),
  planche: require('../../assets/images/thumbs/planche.jpg'),
  releves: require('../../assets/images/thumbs/releves.jpg'),
  squat: require('../../assets/images/thumbs/squat.jpg'),
  fentes: require('../../assets/images/thumbs/fentes.jpg'),
  mollets: require('../../assets/images/thumbs/mollets.jpg'),
  pont: require('../../assets/images/thumbs/pont.jpg'),
  souleve: require('../../assets/images/thumbs/souleve.jpg'),
};

export const muscleImages = {
  pecs: require('../../assets/images/muscles/pecs.jpg'),
  dos: require('../../assets/images/muscles/dos.jpg'),
  epaules: require('../../assets/images/muscles/epaules.jpg'),
  biceps: require('../../assets/images/muscles/biceps.jpg'),
  triceps: require('../../assets/images/muscles/triceps.jpg'),
  abdos: require('../../assets/images/muscles/abdos.jpg'),
  jambes: require('../../assets/images/muscles/jambes.jpg'),
  fessiers: require('../../assets/images/muscles/fessiers.jpg'),
  corps: require('../../assets/images/muscles/corps.jpg'),
} as const;

export const levelImages = {
  debutant: require('../../assets/images/levels/debutant.jpg'),
  inter: require('../../assets/images/levels/inter.jpg'),
  avance: require('../../assets/images/levels/avance.jpg'),
} as const;

export const placeImages = {
  maison: require('../../assets/images/places/maison.jpg'),
  salle: require('../../assets/images/places/salle.jpg'),
} as const;

export const coverImages = {
  hiphop: require('../../assets/images/covers/hiphop.jpg'),
  electro: require('../../assets/images/covers/electro.jpg'),
  rock: require('../../assets/images/covers/rock.jpg'),
  pop: require('../../assets/images/covers/pop.jpg'),
  afro: require('../../assets/images/covers/afro.jpg'),
  lofi: require('../../assets/images/covers/lofi.jpg'),
  pushday: require('../../assets/images/covers/pushday.jpg'),
  ytmix: require('../../assets/images/covers/ytmix.jpg'),
} as const;

export const bodyImages = {
  base: require('../../assets/images/body/base.png'),
  pecs: require('../../assets/images/body/pecs.png'),
  dos: require('../../assets/images/body/dos.png'),
  epaules: require('../../assets/images/body/epaules.png'),
  biceps: require('../../assets/images/body/biceps.png'),
  triceps: require('../../assets/images/body/triceps.png'),
  abdos: require('../../assets/images/body/abdos.png'),
  jambes: require('../../assets/images/body/jambes.png'),
  fessiers: require('../../assets/images/body/fessiers.png'),
} as const;

export const finaleImage: number = require('../../assets/images/finale.jpg');
