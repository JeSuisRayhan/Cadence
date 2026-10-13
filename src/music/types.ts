export type GenreId = 'hiphop' | 'electro' | 'rock' | 'pop' | 'afro' | 'lofi';
export type MusicMode = 'auto' | 'manual';
/** `inapp` : la playlist est composée et jouée dans Cadence ; `external` : on ouvre l'application musicale de la personne. */
export type AutoEngine = 'inapp' | 'external';
export type ExternalApp = 'spotify' | 'youtubemusic' | 'deezer' | 'applemusic';

export interface LocalTrack {
  id: string;
  name: string;
  /** copie dans le dossier de l'application */
  uri: string;
  kind: 'audio' | 'video';
}

export interface MusicSettings {
  mode: MusicMode;
  genres: GenreId[];
  autoEngine: AutoEngine;
  externalApp: ExternalApp;
  /** identifiant client Jamendo (gratuit), nécessaire à la composition dans l'application */
  jamendoClientId: string;
  files: LocalTrack[];
  /** lien d'une playlist YouTube */
  youtubeUrl: string | null;
  /** lancer la musique dès le début de la séance */
  autoStart: boolean;
}

export const DEFAULT_MUSIC: MusicSettings = {
  mode: 'auto',
  genres: ['hiphop', 'electro'],
  autoEngine: 'inapp',
  externalApp: 'spotify',
  jamendoClientId: '',
  files: [],
  youtubeUrl: null,
  autoStart: true,
};

/** Titre jouable par le lecteur. */
export interface Track {
  id: string;
  title: string;
  artist: string;
  genre?: GenreId;
  /** adresse du fichier audio (distante ou locale) */
  uri: string;
  durationSec: number;
  /** illustration (Jamendo) */
  artwork?: string;
  /** page du titre, pour les crédits */
  link?: string;
  source: 'jamendo' | 'local';
}

export interface ComposedPlaylist {
  sessionId: string;
  createdAt: number;
  tracks: Track[];
  /** courbe d'énergie de 0 à 1, une valeur par titre */
  energy: number[];
}
