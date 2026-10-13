import { energyAt } from './curve';
import { AVERAGE_TRACK_SEC, type PoolTrack } from './sources';
import type { GenreId, Track } from './types';

/** Petit générateur pseudo-aléatoire à graine : « Régénérer » donne une autre playlist, un test donne toujours la même. */
export const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Place les titres dans l'ordre de la courbe d'énergie : doux au début, le plus rapide vers les deux tiers
 * de la séance, retour au calme à la fin. On alterne les styles et on évite de répéter un artiste.
 */
export const arrange = (
  pool: readonly PoolTrack[],
  totalSec: number,
  seed: number,
): { tracks: Track[]; energy: number[] } => {
  const random = mulberry32(seed);
  const remaining = [...pool];
  const tracks: Track[] = [];
  const energy: number[] = [];
  const artists = new Set<string>();
  let elapsed = 0;
  let previous: GenreId | undefined;

  while (remaining.length > 0 && elapsed < totalSec) {
    const position = Math.min(1, (elapsed + AVERAGE_TRACK_SEC / 2) / totalSec);
    const wanted = energyAt(position);

    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    remaining.forEach((candidate, index) => {
      const score =
        Math.abs(candidate.speed - wanted * 4) +
        (candidate.track.genre === previous ? 0.7 : 0) +
        (artists.has(candidate.track.artist) ? 3 : 0) +
        random() * 0.6;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [{ track }] = remaining.splice(bestIndex, 1);
    tracks.push(track);
    energy.push(Math.round(wanted * 100) / 100);
    artists.add(track.artist);
    previous = track.genre;
    elapsed += track.durationSec;
  }
  return { tracks, energy };
};
