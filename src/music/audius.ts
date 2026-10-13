import { genreById } from './genres';
import { getJson, MAX_TRACK_SEC, MIN_TRACK_SEC, MusicError, type FetchLike, type PoolTrack } from './sources';
import type { GenreId } from './types';

const API = 'https://api.audius.co/v1';
const SITE = 'https://audius.co';
/** Audius demande à chaque application de s'identifier : son nom suffit pour lire des titres, sans clé. */
const APP_NAME = 'Cadence';
const PER_GENRE = 40;

/** Adresse de lecture d'un titre : Audius renvoie vers le fichier audio au moment où on le joue. */
export const audiusStreamUrl = (id: string): string => `${API}/tracks/${encodeURIComponent(id)}/stream?app_name=${APP_NAME}`;

/** Requête Audius pour un style : ses titres du moment, ou une recherche par mot-clé quand Audius n'a pas ce style. */
export const audiusTracksUrl = (genre: GenreId, limit = PER_GENRE): string => {
  const target = genreById(genre).audius;
  const params = new URLSearchParams({ limit: String(limit), app_name: APP_NAME });
  if ('query' in target) {
    params.set('query', target.query);
    params.set('sort_method', 'popular');
    return `${API}/tracks/search?${params.toString()}`;
  }
  params.set('genre', target.genre);
  params.set('time', 'month');
  return `${API}/tracks/trending?${params.toString()}`;
};

interface RawTrack {
  id?: string;
  title?: string;
  duration?: number;
  mood?: string | null;
  bpm?: number | null;
  permalink?: string;
  artwork?: Record<string, string> | null;
  user?: { name?: string; handle?: string } | null;
  is_streamable?: boolean;
  is_unlisted?: boolean;
  is_delete?: boolean;
  access?: { stream?: boolean } | null;
  /** renseigné quand le titre est réservé (abonnés, achat…) */
  stream_conditions?: unknown;
}

/** Vitesse perçue (0 = très lent … 4 = très rapide) selon l'humeur indiquée par l'artiste. */
const MOOD_SPEED = new Map<string, number>([
  ['Aggressive', 4],
  ['Fiery', 4],
  ['Rowdy', 4],
  ['Energizing', 4],
  ['Excited', 3],
  ['Upbeat', 3],
  ['Empowering', 3],
  ['Defiant', 3],
  ['Stirring', 3],
  ['Gritty', 2],
  ['Cool', 2],
  ['Serious', 2],
  ['Sophisticated', 2],
  ['Easygoing', 1],
  ['Sensual', 1],
  ['Brooding', 1],
  ['Romantic', 1],
  ['Yearning', 1],
  ['Peaceful', 0],
  ['Tender', 0],
  ['Sentimental', 0],
  ['Melancholy', 0],
]);

const bpmSpeed = (bpm: number): number => (bpm < 85 ? 0 : bpm < 105 ? 1 : bpm < 125 ? 2 : bpm < 145 ? 3 : 4);

/** Humeur et rythme (BPM) donnent chacun une vitesse ; avec les deux on prend le milieu, sans rien on reste au centre. */
export const audiusSpeedRank = (mood: unknown, bpm: unknown): number => {
  const fromMood = typeof mood === 'string' ? MOOD_SPEED.get(mood) : undefined;
  const fromBpm = typeof bpm === 'number' && Number.isFinite(bpm) && bpm > 0 ? bpmSpeed(bpm) : undefined;
  if (fromMood !== undefined && fromBpm !== undefined) return Math.round((fromMood + fromBpm) / 2);
  return fromMood ?? fromBpm ?? 2;
};

const normalize = (raw: RawTrack, genre: GenreId): PoolTrack | null => {
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  if (!id) return null;
  // titres supprimés, masqués ou réservés : on ne pourrait pas les lire
  if (raw.is_streamable === false || raw.is_unlisted || raw.is_delete) return null;
  if (raw.access?.stream === false || raw.stream_conditions) return null;
  const duration = Number(raw.duration);
  if (!Number.isFinite(duration) || duration < MIN_TRACK_SEC || duration > MAX_TRACK_SEC) return null;
  const artwork = (raw.artwork?.['480x480'] ?? raw.artwork?.['150x150'])?.trim();
  return {
    track: {
      id: `audius-${id}`,
      title: raw.title?.trim() || 'Sans titre',
      artist: raw.user?.name?.trim() || raw.user?.handle?.trim() || 'Artiste inconnu',
      genre,
      uri: audiusStreamUrl(id),
      durationSec: Math.round(duration),
      artwork: artwork || undefined,
      link: raw.permalink?.startsWith('/') ? `${SITE}${raw.permalink}` : undefined,
      source: 'audius',
    },
    speed: audiusSpeedRank(raw.mood, raw.bpm),
  };
};

/** Les titres d'un style sur Audius, sans clé : lecture libre pour les applications qui s'identifient. */
export const fetchAudiusGenre = async (genre: GenreId, fetchImpl: FetchLike, signal?: AbortSignal): Promise<PoolTrack[]> => {
  const body = await getJson(audiusTracksUrl(genre), fetchImpl, signal, 'Audius');
  const data = (body as { data?: unknown } | null)?.data;
  if (!Array.isArray(data)) throw new MusicError('api', 'Réponse inattendue d’Audius');
  const out: PoolTrack[] = [];
  for (const raw of data as unknown[]) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = normalize(raw as RawTrack, genre);
    if (entry) out.push(entry);
  }
  return out;
};
