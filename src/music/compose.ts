import { arrange } from './arrange';
import { fetchAudiusGenre } from './audius';
import { fetchJamendoGenre } from './jamendo';
import { mergePools, MusicError, type FetchLike } from './sources';
import type { ComposedPlaylist, GenreId } from './types';

const MAX_GENRES = 6;

export interface ComposeOptions {
  sessionId: string;
  /** clé Jamendo, facultative : sans elle la playlist vient d'Audius seul */
  clientId: string;
  genres: readonly GenreId[];
  durationMin: number;
  seed?: number;
  now?: number;
  fetchImpl?: FetchLike;
  signal?: AbortSignal;
}

/**
 * Compose la playlist d'une séance avec Audius (sans clé) et Jamendo (avec sa clé gratuite) : une requête par style et par source,
 * puis les titres sont rangés le long de la courbe d'énergie. Une source en panne n'empêche pas l'autre.
 */
export const composePlaylist = async (options: ComposeOptions): Promise<ComposedPlaylist> => {
  const genres = [...new Set(options.genres)].slice(0, MAX_GENRES);
  if (genres.length === 0) throw new MusicError('empty', 'Aucun style choisi');
  const clientId = options.clientId.trim();
  const fetchImpl: FetchLike = options.fetchImpl ?? ((url, init) => fetch(url, init));

  const requests = [
    ...(clientId ? genres.map((genre) => fetchJamendoGenre(clientId, genre, fetchImpl, options.signal)) : []),
    ...genres.map((genre) => fetchAudiusGenre(genre, fetchImpl, options.signal)),
  ];
  const pool = mergePools(await Promise.allSettled(requests));

  const { tracks, energy } = arrange(pool, Math.max(options.durationMin, 5) * 60, options.seed ?? Date.now());
  return { sessionId: options.sessionId, createdAt: options.now ?? Date.now(), tracks, energy };
};
