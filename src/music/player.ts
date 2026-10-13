import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { Linking } from 'react-native';
import { create } from 'zustand';
import type { Track } from './types';
import type { YoutubeLink } from './youtube';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused';

export interface ExternalPlayback {
  /** nom de l'application ouverte (Spotify, YouTube…) */
  label: string;
  url: string;
}

export interface PlayerState {
  status: PlayerStatus;
  queue: Track[];
  index: number;
  /** séance pour laquelle la musique a été lancée */
  sessionId: string | null;
  /** nom de la source affichée pendant la préparation (« Playlist de la séance », « Mes fichiers ») */
  source: string | null;
  external: ExternalPlayback | null;
  /** playlist YouTube lue dans le panneau de la séance (le lecteur officiel de YouTube) */
  youtube: YoutubeLink | null;
  /** explication à afficher dans le mini-lecteur quand la musique ne peut pas démarrer */
  message: string | null;
}

const INITIAL: PlayerState = {
  status: 'idle',
  queue: [],
  index: 0,
  sessionId: null,
  source: null,
  external: null,
  youtube: null,
  message: null,
};

export const usePlayer = create<PlayerState>(() => INITIAL);

export const selectCurrentTrack = (s: PlayerState): Track | null => s.queue[s.index] ?? null;

/**
 * Juste après le chargement d'un titre, le lecteur peut encore signaler la fin ou l'erreur du titre précédent,
 * ou rester un instant « non lu » : pendant ce délai on ignore ces signaux et on n'affiche pas de pause.
 */
const SETTLE_MS = 1200;
/** Au-delà de ce temps de lecture, « précédent » recommence le titre au lieu de reculer. */
const RESTART_AFTER_SEC = 3;

let player: AudioPlayer | null = null;
let subscription: { remove: () => void } | null = null;
let audioModeReady = false;
let settleUntil = 0;
let failuresInRow = 0;
/** change à chaque nouveau lancement ou arrêt : une composition lente ne démarre pas une musique périmée */
let startToken = 0;

const releasePlayer = (): void => {
  failuresInRow = 0;
  if (!player) return;
  try {
    player.pause();
    player.clearLockScreenControls();
  } catch {
    // rien à nettoyer
  }
  subscription?.remove();
  try {
    player.remove();
  } catch {
    // déjà libéré
  }
  player = null;
  subscription = null;
};

const metadataOf = (track: Track) => ({
  title: track.title,
  artist: track.artist,
  albumTitle: 'Cadence',
  artworkUrl: track.artwork,
});

const loadTrack = (index: number): void => {
  const { queue } = usePlayer.getState();
  const track = queue[index];
  if (!player || !track) return;
  settleUntil = Date.now() + SETTLE_MS;
  usePlayer.setState({ index, status: 'loading', message: null });
  try {
    player.replace({ uri: track.uri, name: track.title });
    player.updateLockScreenMetadata(metadataOf(track));
    player.play();
  } catch {
    onTrackFailed();
  }
};

const step = (delta: 1 | -1): void => {
  const { queue, index } = usePlayer.getState();
  if (queue.length === 0) return;
  loadTrack((index + delta + queue.length) % queue.length);
};

/** Titre illisible (fichier supprimé, lien expiré, pas de réseau) : on passe au suivant, sauf si plus rien ne se lit. */
const onTrackFailed = (): void => {
  const { queue } = usePlayer.getState();
  failuresInRow += 1;
  if (failuresInRow >= queue.length) {
    failuresInRow = 0;
    try {
      player?.pause();
    } catch {
      // le lecteur est déjà arrêté
    }
    usePlayer.setState({ status: 'paused', message: 'Impossible de lire ces titres. Vérifie ta connexion.' });
    return;
  }
  step(1);
};

const onStatus = (status: AudioStatus): void => {
  const settling = Date.now() < settleUntil;
  if (status.didJustFinish) {
    if (!settling) {
      failuresInRow = 0;
      step(1);
    }
    return;
  }
  if (status.error) {
    // l'erreur reste signalée à chaque mise à jour tant qu'un autre titre n'est pas chargé : on la traite une fois le délai passé
    if (!settling) onTrackFailed();
    return;
  }

  const state = usePlayer.getState();
  if (state.queue.length === 0) return;
  if (status.playing) {
    failuresInRow = 0;
    if (state.status !== 'playing') usePlayer.setState({ status: 'playing', message: null });
  } else if (status.isLoaded && !status.isBuffering && Date.now() >= settleUntil) {
    if (state.status !== 'paused') usePlayer.setState({ status: 'paused' });
  }
};

const ensurePlayer = async (): Promise<AudioPlayer> => {
  if (!audioModeReady) {
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
    audioModeReady = true;
  }
  if (!player) {
    player = createAudioPlayer(null, { updateInterval: 500 });
    subscription = player.addListener('playbackStatusUpdate', onStatus);
  }
  return player;
};

/** Annonce une nouvelle musique de séance : arrête la précédente et renvoie le jeton à vérifier après chaque attente. */
export const beginSessionMusic = (sessionId: string, source: string): number => {
  releasePlayer();
  startToken += 1;
  usePlayer.setState({ ...INITIAL, sessionId, source, status: 'loading' });
  return startToken;
};

export const isCurrentStart = (token: number): boolean => token === startToken;

/** Joue la liste dans l'application, écran verrouillé compris, et la reprend au début quand elle se termine. */
export const startQueue = async (tracks: Track[], source: string, startIndex = 0): Promise<void> => {
  if (tracks.length === 0) return;
  const token = startToken;
  try {
    const audio = await ensurePlayer();
    if (token !== startToken) return;
    failuresInRow = 0;
    usePlayer.setState({ queue: tracks, index: startIndex, source, external: null, youtube: null, message: null, status: 'loading' });
    try {
      audio.setActiveForLockScreen(true, metadataOf(tracks[startIndex]), {
        showSeekForward: false,
        showSeekBackward: false,
      });
    } catch {
      // commandes de l'écran verrouillé indisponibles (web) : la lecture fonctionne quand même
    }
    loadTrack(startIndex);
  } catch {
    usePlayer.setState({ status: 'idle', message: 'La lecture n’a pas pu démarrer.' });
  }
};

export const togglePlayback = (): void => {
  const { status } = usePlayer.getState();
  if (!player) return;
  try {
    if (status === 'playing') {
      player.pause();
      usePlayer.setState({ status: 'paused' });
    } else if (status === 'paused') {
      settleUntil = Date.now() + SETTLE_MS;
      player.play();
      usePlayer.setState({ status: 'playing', message: null });
    }
  } catch {
    usePlayer.setState({ message: 'La lecture n’a pas répondu.' });
  }
};

export const nextTrack = (): void => step(1);

export const previousTrack = (): void => {
  if (player && player.currentTime > RESTART_AFTER_SEC) {
    void player.seekTo(0);
    return;
  }
  step(-1);
};

/** Ouvre l'application musicale de la personne (la lecture se poursuit hors de Cadence). */
export const openExternalMusic = async (label: string, url: string): Promise<void> => {
  releasePlayer();
  usePlayer.setState({ ...INITIAL, sessionId: usePlayer.getState().sessionId, external: { label, url } });
  try {
    await Linking.openURL(url);
  } catch {
    usePlayer.setState({ message: `Impossible d’ouvrir ${label}.` });
  }
};

/**
 * Joue la playlist YouTube dans le panneau de la séance, avec le lecteur officiel : l'application reste utilisable par-dessus.
 * YouTube interdit la lecture en arrière-plan : le panneau met la lecture en pause dès que l'application quitte l'écran.
 */
export const startYoutube = (link: YoutubeLink): void => {
  releasePlayer();
  // « playing » : la musique de la séance est lancée, ce qui évite un second lancement
  usePlayer.setState({ ...INITIAL, sessionId: usePlayer.getState().sessionId, source: 'YouTube', youtube: link, status: 'playing' });
};

/** Ferme le panneau YouTube ; le mini-lecteur propose alors de relancer la musique. */
export const stopYoutube = (): void => {
  usePlayer.setState({ ...INITIAL, sessionId: usePlayer.getState().sessionId });
};

export const setPlayerMessage = (message: string | null): void => {
  usePlayer.setState({ status: 'idle', message });
};

/** Arrête la musique et libère le lecteur (fin ou abandon de la séance). */
export const stopMusic = (): void => {
  startToken += 1;
  releasePlayer();
  usePlayer.setState(INITIAL);
};
