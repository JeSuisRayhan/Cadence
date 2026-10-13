import type { Track } from './types';

export type MusicErrorKind = 'offline' | 'api' | 'empty' | 'aborted';

/** Échec d'une source de musique (Jamendo, Audius) ou de la composition de la playlist. */
export class MusicError extends Error {
  readonly kind: MusicErrorKind;

  constructor(kind: MusicErrorKind, message: string) {
    super(message);
    this.name = 'MusicError';
    this.kind = kind;
  }
}

/** Message affiché à la personne pour chaque cas d'échec. */
export const musicMessage = (error: unknown): string => {
  const kind = error instanceof MusicError ? error.kind : 'api';
  switch (kind) {
    case 'offline':
      return 'Pas de connexion : la playlist n’a pas pu être composée.';
    case 'empty':
      return 'Aucun titre trouvé pour ces styles. Essaie d’en ajouter un.';
    case 'aborted':
      return '';
    default:
      return 'Les sources de musique ne répondent pas pour le moment. Réessaie dans un instant.';
  }
};

/** Titre d'une source avec sa vitesse (0 = très lent … 4 = très rapide), utilisée pour suivre la courbe d'énergie. */
export interface PoolTrack {
  track: Track;
  speed: number;
}

export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

const TIMEOUT_MS = 10_000;

/** Un titre plus court est un extrait, un titre plus long un mix : ni l'un ni l'autre ne convient à une séance. */
export const MIN_TRACK_SEC = 100;
export const MAX_TRACK_SEC = 360;
/** durée moyenne d'un titre, utilisée tant qu'on ne connaît pas celle du titre suivant */
export const AVERAGE_TRACK_SEC = 210;

/** Lit une réponse JSON, avec un délai maximal ; `source` nomme le service dans les messages d'erreur. */
export const getJson = async (
  url: string,
  fetchImpl: FetchLike,
  signal: AbortSignal | undefined,
  source: string,
): Promise<unknown> => {
  if (signal?.aborted) throw new MusicError('aborted', 'Composition annulée');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const forward = () => controller.abort();
  signal?.addEventListener('abort', forward);
  try {
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await fetchImpl(url, { signal: controller.signal });
    } catch {
      if (signal?.aborted) throw new MusicError('aborted', 'Composition annulée');
      throw new MusicError('offline', 'Pas de connexion');
    }
    if (!response.ok) throw new MusicError('api', `${source} a répondu ${response.status}`);
    try {
      return await response.json();
    } catch {
      throw new MusicError('api', `Réponse illisible de ${source}`);
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forward);
  }
};

/**
 * Réunit les titres de toutes les requêtes, sans doublon. Une requête qui échoue n'empêche rien tant qu'une autre répond ;
 * si aucun titre n'est trouvé, on remonte l'échec le plus parlant (une annulation passe après les vraies pannes).
 */
export const mergePools = (results: readonly PromiseSettledResult<PoolTrack[]>[]): PoolTrack[] => {
  const seen = new Set<string>();
  const pool: PoolTrack[] = [];
  const failures: MusicError[] = [];
  for (const result of results) {
    if (result.status === 'rejected') {
      failures.push(result.reason instanceof MusicError ? result.reason : new MusicError('api', 'Réponse inattendue'));
      continue;
    }
    for (const entry of result.value) {
      if (seen.has(entry.track.id)) continue;
      seen.add(entry.track.id);
      pool.push(entry);
    }
  }
  if (pool.length > 0) return pool;
  throw failures.find((failure) => failure.kind !== 'aborted') ?? failures[0] ?? new MusicError('empty', 'Aucun titre trouvé');
};
