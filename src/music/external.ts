import { genreById } from './genres';
import type { ExternalApp, GenreId } from './types';

export const EXTERNAL_APPS: readonly { id: ExternalApp; label: string }[] = [
  { id: 'spotify', label: 'Spotify' },
  { id: 'youtubemusic', label: 'YouTube Music' },
  { id: 'deezer', label: 'Deezer' },
  { id: 'applemusic', label: 'Apple Music' },
];

export const externalLabel = (app: ExternalApp): string => EXTERNAL_APPS.find((a) => a.id === app)?.label ?? 'Spotify';

/** Recherche à ouvrir : les genres choisis suivis de « workout ». */
export const externalQuery = (genres: readonly GenreId[]): string =>
  [...genres.map((g) => genreById(g).query), 'workout'].join(' ');

/** Adresse de recherche de playlists dans l'application musicale de la personne. */
export const externalSearchUrl = (app: ExternalApp, genres: readonly GenreId[]): string => {
  const q = encodeURIComponent(externalQuery(genres));
  switch (app) {
    case 'spotify':
      return `https://open.spotify.com/search/${q}/playlists`;
    case 'youtubemusic':
      return `https://music.youtube.com/search?q=${q}`;
    case 'deezer':
      return `https://www.deezer.com/search/${q}/playlist`;
    case 'applemusic':
      return `https://music.apple.com/search?term=${q}`;
  }
};
