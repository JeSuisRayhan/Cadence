import { energyAt, speedRankOf } from './curve';
import { genreById } from './genres';
import type { ComposedPlaylist, GenreId, Track } from './types';

const ENDPOINT = 'https://api.jamendo.com/v3.0/tracks/';
const PER_GENRE = 40;
const TIMEOUT_MS = 10_000;
/** durée moyenne d'un titre, utilisée tant qu'on ne connaît pas celle du titre suivant */
export const AVERAGE_TRACK_SEC = 210;
const MAX_GENRES = 6;

export type JamendoErrorKind = 'no-key' | 'offline' | 'api' | 'empty' | 'aborted';

export class JamendoError extends Error {
  readonly kind: JamendoErrorKind;

  constructor(kind: JamendoErrorKind, message: string) {
    super(message);
    this.name = 'JamendoError';
    this.kind = kind;
  }
}

/** Message affiché à la personne pour chaque cas d'échec. */
export const jamendoMessage = (error: unknown): string => {
  const kind = error instanceof JamendoError ? error.kind : 'api';
  switch (kind) {
    case 'no-key':
      return 'Ajoute ta clé Jamendo pour composer la playlist.';
    case 'offline':
      return 'Pas de connexion : la playlist n’a pas pu être composée.';
    case 'empty':
      return 'Aucun titre trouvé pour ces styles. Essaie d’en ajouter un.';
    case 'aborted':
      return '';
    default:
      return 'Jamendo ne répond pas pour le moment. Vérifie ta clé ou réessaie.';
  }
};

interface RawTrack {
  id?: string | number;
  name?: string;
  duration?: number | string;
  artist_name?: string;
  image?: string;
  audio?: string;
  shareurl?: string;
  musicinfo?: { speed?: string };
}

interface RawResponse {
  headers?: { status?: string; code?: number; error_message?: string };
  results?: RawTrack[];
}

type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

/** Titre du catalogue avec sa vitesse (0 = très lent … 4 = très rapide), utilisée pour suivre la courbe d'énergie. */
export interface PoolTrack {
  track: Track;
  speed: number;
}

/** Clé Jamendo : celle saisie dans l'application, sinon celle fournie à la compilation. */
export const resolveClientId = (saved: string): string =>
  saved.trim() || (process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID ?? '').trim();

export const tracksUrl = (clientId: string, genre: GenreId, limit = PER_GENRE, offset = 0): string => {
  const params = new URLSearchParams({
    client_id: clientId.trim(),
    format: 'json',
    limit: String(limit),
    offset: String(offset),
    order: 'popularity_month',
    fuzzytags: genreById(genre).tags.join(' '),
    groupby: 'artist_id',
    include: 'musicinfo',
    audioformat: 'mp32',
    imagesize: '300',
    durationbetween: '100_360',
    type: 'single albumtrack',
  });
  return `${ENDPOINT}?${params.toString()}`;
};

const getJson = async (url: string, fetchImpl: FetchLike, signal?: AbortSignal): Promise<RawResponse> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const forward = () => controller.abort();
  signal?.addEventListener('abort', forward);
  try {
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await fetchImpl(url, { signal: controller.signal });
    } catch {
      if (signal?.aborted) throw new JamendoError('aborted', 'Composition annulée');
      throw new JamendoError('offline', 'Pas de connexion');
    }
    if (!response.ok) throw new JamendoError('api', `Jamendo a répondu ${response.status}`);
    let body: RawResponse;
    try {
      body = (await response.json()) as RawResponse;
    } catch {
      throw new JamendoError('api', 'Réponse illisible');
    }
    if (body.headers?.status === 'failed') {
      throw new JamendoError('api', body.headers.error_message ?? 'Demande refusée');
    }
    return body;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forward);
  }
};

const normalize = (raw: RawTrack, genre: GenreId): PoolTrack | null => {
  const audio = raw.audio?.trim();
  if (!audio || raw.id === undefined || raw.id === null) return null;
  const duration = Number(raw.duration);
  return {
    track: {
      id: `jamendo-${raw.id}`,
      title: raw.name?.trim() || 'Sans titre',
      artist: raw.artist_name?.trim() || 'Artiste inconnu',
      genre,
      uri: audio,
      durationSec: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : AVERAGE_TRACK_SEC,
      artwork: raw.image?.trim() || undefined,
      link: raw.shareurl?.trim() || undefined,
      source: 'jamendo',
    },
    speed: speedRankOf(raw.musicinfo?.speed),
  };
};

export const fetchGenre = async (
  clientId: string,
  genre: GenreId,
  fetchImpl: FetchLike,
  signal?: AbortSignal,
): Promise<PoolTrack[]> => {
  const body = await getJson(tracksUrl(clientId, genre), fetchImpl, signal);
  const out: PoolTrack[] = [];
  for (const raw of body.results ?? []) {
    const track = normalize(raw, genre);
    if (track) out.push(track);
  }
  return out;
};

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

export interface ComposeOptions {
  sessionId: string;
  clientId: string;
  genres: readonly GenreId[];
  durationMin: number;
  seed?: number;
  now?: number;
  fetchImpl?: FetchLike;
  signal?: AbortSignal;
}

/** Compose la playlist d'une séance depuis le catalogue Jamendo. */
export const composePlaylist = async (options: ComposeOptions): Promise<ComposedPlaylist> => {
  const clientId = options.clientId.trim();
  if (!clientId) throw new JamendoError('no-key', 'Clé Jamendo manquante');
  const genres = [...new Set(options.genres)].slice(0, MAX_GENRES);
  if (genres.length === 0) throw new JamendoError('empty', 'Aucun style choisi');
  const fetchImpl: FetchLike = options.fetchImpl ?? ((url, init) => fetch(url, init));

  const results = await Promise.allSettled(genres.map((genre) => fetchGenre(clientId, genre, fetchImpl, options.signal)));

  const seen = new Set<string>();
  const pool: PoolTrack[] = [];
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const entry of result.value) {
      if (seen.has(entry.track.id)) continue;
      seen.add(entry.track.id);
      pool.push(entry);
    }
  }

  if (pool.length === 0) {
    const failure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failure) {
      throw failure.reason instanceof JamendoError ? failure.reason : new JamendoError('api', 'Réponse inattendue');
    }
    throw new JamendoError('empty', 'Aucun titre trouvé');
  }

  const { tracks, energy } = arrange(pool, Math.max(options.durationMin, 5) * 60, options.seed ?? Date.now());
  return { sessionId: options.sessionId, createdAt: options.now ?? Date.now(), tracks, energy };
};
