import type { LocalTrack, Track } from './types';

/** « 01_mon_titre.mp3 » → « 01 mon titre » */
export const titleFromFileName = (fileName: string): string => {
  const base = fileName
    .replace(/\.[^./\\]+$/, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base || 'Sans titre';
};

export const isVideoFile = (fileName: string, mimeType: string): boolean =>
  mimeType.startsWith('video/') || /\.(mp4|m4v|mov)$/i.test(fileName);

export const localToTrack = (local: LocalTrack): Track => ({
  id: `local-${local.id}`,
  title: local.name,
  artist: local.kind === 'video' ? 'Vidéo importée' : 'Ma musique',
  uri: local.uri,
  durationSec: 0,
  source: 'local',
});
