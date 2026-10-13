export interface YoutubeLink {
  kind: 'playlist' | 'video';
  id: string;
  /** adresse normalisée, ouvrable dans l'application YouTube */
  url: string;
}

const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);
const LIST_ID = /^[A-Za-z0-9_-]{10,64}$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Reconnaît un lien de playlist (ou de vidéo) YouTube. Renvoie null pour tout autre lien :
 * le lien est ensuite ouvert tel quel, donc on ne garde que des adresses YouTube.
 */
export const parseYoutubeLink = (input: string): YoutubeLink | null => {
  const text = input.trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (!HOSTS.has(url.hostname.toLowerCase())) return null;

  const list = url.searchParams.get('list');
  if (list && LIST_ID.test(list)) {
    return { kind: 'playlist', id: list, url: `https://www.youtube.com/playlist?list=${list}` };
  }

  const video = url.hostname.toLowerCase() === 'youtu.be' ? url.pathname.slice(1).split('/')[0] : url.searchParams.get('v');
  if (video && VIDEO_ID.test(video)) {
    return { kind: 'video', id: video, url: `https://www.youtube.com/watch?v=${video}` };
  }
  return null;
};
