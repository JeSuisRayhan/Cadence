import { externalLabel, externalSearchUrl } from './external';
import { genreLabels } from './genres';
import { JamendoError, jamendoMessage, resolveClientId } from './jamendo';
import { localToTrack } from './localTracks';
import { loadPlaylist } from './playlist';
import {
  beginSessionMusic,
  isCurrentStart,
  openExternalMusic,
  setPlayerMessage,
  startQueue,
  usePlayer,
} from './player';
import type { MusicSettings } from './types';
import { parseYoutubeLink } from './youtube';

export interface MusicTarget {
  id: string;
  durationMin: number;
}

export const PLAYLIST_SOURCE = 'Playlist de la séance';

/**
 * Lance la musique d'une séance selon les réglages :
 * - mode manuel : tes fichiers dans l'application, sinon ta playlist YouTube ouverte dans YouTube ;
 * - mode automatique : playlist composée dans l'application (Jamendo), ou recherche ouverte dans ton application musicale.
 */
export const startSessionMusic = async (target: MusicTarget, music: MusicSettings): Promise<void> => {
  const current = usePlayer.getState();
  if (current.sessionId === target.id && (current.status === 'playing' || current.status === 'loading')) return;

  if (music.mode === 'manual') {
    const token = beginSessionMusic(target.id, 'Mes fichiers');
    if (music.files.length > 0) {
      await startQueue(music.files.map(localToTrack), 'Mes fichiers');
      return;
    }
    const link = music.youtubeUrl ? parseYoutubeLink(music.youtubeUrl) : null;
    if (link) {
      if (isCurrentStart(token)) await openExternalMusic('YouTube', link.url);
      return;
    }
    setPlayerMessage('Ajoute tes fichiers ou une playlist YouTube dans Musique.');
    return;
  }

  if (music.autoEngine === 'external') {
    const token = beginSessionMusic(target.id, externalLabel(music.externalApp));
    if (isCurrentStart(token)) {
      await openExternalMusic(externalLabel(music.externalApp), externalSearchUrl(music.externalApp, music.genres));
    }
    return;
  }

  const token = beginSessionMusic(target.id, PLAYLIST_SOURCE);
  if (!resolveClientId(music.jamendoClientId)) {
    setPlayerMessage(jamendoMessage(new JamendoError('no-key', '')));
    return;
  }
  try {
    const playlist = await loadPlaylist({ sessionId: target.id, durationMin: target.durationMin, music });
    if (!isCurrentStart(token)) return;
    await startQueue(playlist.tracks, PLAYLIST_SOURCE);
  } catch (error) {
    if (isCurrentStart(token)) setPlayerMessage(jamendoMessage(error));
  }
};

/** Phrase de présentation de la source choisie, pour la ligne « Playlist de la séance ». */
export const musicSummary = (music: MusicSettings): string => {
  if (music.mode === 'manual') {
    if (music.files.length > 0) return `Manuel · ${music.files.length} ${music.files.length > 1 ? 'fichiers' : 'fichier'}`;
    if (music.youtubeUrl && parseYoutubeLink(music.youtubeUrl)) return 'Manuel · playlist YouTube';
    return 'Manuel · rien d’ajouté';
  }
  if (music.autoEngine === 'external') return `Automatique · ${externalLabel(music.externalApp)}`;
  return `Automatique · ${genreLabels(music.genres)}`;
};
