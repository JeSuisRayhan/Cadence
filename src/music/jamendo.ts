import { speedRankOf } from './curve';
import { genreById } from './genres';
import { getJson, MAX_TRACK_SEC, MIN_TRACK_SEC, MusicError, AVERAGE_TRACK_SEC, type FetchLike, type PoolTrack } from './sources';
import type { GenreId } from './types';

const ENDPOINT = 'https://api.jamendo.com/v3.0/tracks/';
const PER_GENRE = 40;

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
    durationbetween: `${MIN_TRACK_SEC}_${MAX_TRACK_SEC}`,
    type: 'single albumtrack',
  });
  return `${ENDPOINT}?${params.toString()}`;
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

/** Les titres populaires d'un style dans le catalogue Jamendo. */
export const fetchJamendoGenre = async (
  clientId: string,
  genre: GenreId,
  fetchImpl: FetchLike,
  signal?: AbortSignal,
): Promise<PoolTrack[]> => {
  const body = (await getJson(tracksUrl(clientId, genre), fetchImpl, signal, 'Jamendo')) as RawResponse | null;
  if (body?.headers?.status === 'failed') {
    throw new MusicError('api', body.headers.error_message ?? 'Demande refusée');
  }
  const out: PoolTrack[] = [];
  for (const raw of body?.results ?? []) {
    const track = normalize(raw, genre);
    if (track) out.push(track);
  }
  return out;
};
