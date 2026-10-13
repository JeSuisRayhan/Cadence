import type { coverImages } from '../assets/images';
import type { GenreId } from './types';

export interface Genre {
  id: GenreId;
  label: string;
  cover: keyof typeof coverImages;
  /** étiquettes Jamendo : un titre qui en porte une seule est retenu */
  tags: readonly string[];
  /** mot utilisé pour chercher une playlist dans une application musicale */
  query: string;
}

export const GENRES: readonly Genre[] = [
  { id: 'hiphop', label: 'Hip-hop', cover: 'hiphop', tags: ['hiphop', 'rap'], query: 'hip hop' },
  { id: 'electro', label: 'Électro', cover: 'electro', tags: ['electronic', 'house', 'techno'], query: 'electro' },
  { id: 'rock', label: 'Rock', cover: 'rock', tags: ['rock', 'hardrock'], query: 'rock' },
  { id: 'pop', label: 'Pop', cover: 'pop', tags: ['pop', 'dance'], query: 'pop' },
  { id: 'afro', label: 'Afro', cover: 'afro', tags: ['afrobeat', 'afropop', 'african'], query: 'afrobeats' },
  { id: 'lofi', label: 'Lo-fi', cover: 'lofi', tags: ['lofi', 'chillhop', 'chillout'], query: 'lofi' },
];

export const genreById = (id: GenreId): Genre => GENRES.find((g) => g.id === id) ?? GENRES[0];

/** « Hip-hop, Électro » */
export const genreLabels = (ids: readonly GenreId[]): string => ids.map((id) => genreById(id).label).join(', ');
