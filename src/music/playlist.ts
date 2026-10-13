import { composePlaylist } from './compose';
import { jamendoClientId } from './jamendo';
import type { ComposedPlaylist, GenreId, MusicSettings } from './types';

/** Les titres ne se gardent pas hors ligne : la playlist reste en mémoire, quelques heures au plus. */
const TTL_MS = 3 * 60 * 60 * 1000;

const cache = new Map<string, ComposedPlaylist>();

export const playlistKey = (sessionId: string, genres: readonly GenreId[], durationMin: number): string =>
  `${sessionId}|${[...genres].sort().join(',')}|${durationMin}`;

export const cachedPlaylist = (key: string, now: number = Date.now()): ComposedPlaylist | null => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (now - hit.createdAt > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit;
};

export const clearPlaylists = (): void => cache.clear();

export interface PlaylistRequest {
  sessionId: string;
  durationMin: number;
  music: Pick<MusicSettings, 'genres'>;
  /** true : recomposer même si une playlist est déjà en mémoire */
  refresh?: boolean;
  signal?: AbortSignal;
}

/** La playlist de la séance : celle en mémoire, sinon une nouvelle composition. */
export const loadPlaylist = async ({
  sessionId,
  durationMin,
  music,
  refresh = false,
  signal,
}: PlaylistRequest): Promise<ComposedPlaylist> => {
  const key = playlistKey(sessionId, music.genres, durationMin);
  if (!refresh) {
    const hit = cachedPlaylist(key);
    if (hit) return hit;
  }
  const playlist = await composePlaylist({ sessionId, clientId: jamendoClientId(), genres: music.genres, durationMin, signal });
  cache.set(key, playlist);
  return playlist;
};
