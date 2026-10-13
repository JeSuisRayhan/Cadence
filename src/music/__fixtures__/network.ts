/** Faux réseau pour les tests de musique : réponses au format réel de Jamendo et d'Audius, sans aucun appel externe. */

export interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

type Handler = (url: URL) => Promise<FakeResponse>;

export const reply = (body: unknown, status = 200): Promise<FakeResponse> =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body });

export const offline = (): Promise<never> => Promise.reject(new TypeError('Network request failed'));

/** Titre tel que Jamendo le renvoie. */
export const jamendoTrack = (id: number, speed = 'medium', artist = `Artiste ${id}`, duration = 200) => ({
  id: String(id),
  name: `Titre ${id}`,
  duration,
  artist_name: artist,
  image: `https://img.example/${id}.jpg`,
  audio: `https://audio.example/${id}.mp3`,
  shareurl: `https://www.jamendo.com/track/${id}`,
  musicinfo: { speed },
});

export const jamendoBody = (results: unknown[]) => ({ headers: { status: 'success', code: 0 }, results });

/** Titre tel qu'Audius le renvoie (seuls les champs utiles). */
export const audiusTrack = (id: string, patch: Record<string, unknown> = {}) => ({
  id,
  title: `Morceau ${id}`,
  duration: 200,
  genre: 'Electronic',
  mood: 'Energizing',
  bpm: 128,
  permalink: `/artiste-${id}/morceau-${id}`,
  artwork: { '150x150': `https://art.example/${id}/150.jpg`, '480x480': `https://art.example/${id}/480.jpg` },
  user: { name: `Artiste ${id}`, handle: `artiste${id}` },
  is_streamable: true,
  is_unlisted: false,
  is_delete: false,
  access: { stream: true, download: false },
  stream_conditions: null,
  ...patch,
});

export const audiusBody = (data: unknown[]) => ({ data });

/** Un `fetch` simulé qui répond selon le service interrogé ; toute autre adresse est une erreur. */
export const fakeNetwork = (handlers: { jamendo?: Handler; audius?: Handler }) =>
  jest.fn((url: string): Promise<FakeResponse> => {
    const parsed = new URL(url);
    if (parsed.hostname === 'api.jamendo.com') return (handlers.jamendo ?? offline)(parsed);
    if (parsed.hostname === 'api.audius.co') return (handlers.audius ?? offline)(parsed);
    return Promise.reject(new Error(`Adresse inattendue : ${url}`));
  });

/** Les requêtes reçues par un service. */
export const callsTo = (network: ReturnType<typeof fakeNetwork>, hostname: string): URL[] =>
  network.mock.calls.map(([url]) => new URL(url)).filter((url) => url.hostname === hostname);
