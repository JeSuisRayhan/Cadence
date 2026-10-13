import { Linking } from 'react-native';
import { audiusBody, audiusTrack, callsTo, fakeNetwork, jamendoBody, jamendoTrack, reply } from '../__fixtures__/network';
import { clearPlaylists } from '../playlist';
import { usePlayer, stopMusic } from '../player';
import { musicSummary, startSessionMusic } from '../session';
import { DEFAULT_MUSIC, type MusicSettings } from '../types';

jest.mock('expo-audio', () => {
  const fake = {
    currentTime: 0,
    replace: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(async () => undefined),
    setActiveForLockScreen: jest.fn(),
    updateLockScreenMetadata: jest.fn(),
    clearLockScreenControls: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  };
  return {
    __fake: fake,
    createAudioPlayer: jest.fn(() => fake),
    setAudioModeAsync: jest.fn(async () => undefined),
  };
});

const fake = (jest.requireMock('expo-audio') as { __fake: { replace: jest.Mock; play: jest.Mock } }).__fake;

const target = { id: 'prog-1', durationMin: 45 };
const settings = (patch: Partial<MusicSettings>): MusicSettings => ({ ...DEFAULT_MUSIC, ...patch });

const jamendoCatalogue = Array.from({ length: 30 }, (_, i) =>
  jamendoTrack(500 + i, ['verylow', 'low', 'medium', 'high', 'veryhigh'][i % 5]),
);

const audiusCatalogue = Array.from({ length: 30 }, (_, i) => audiusTrack(`s${i}`, { mood: null, bpm: [70, 95, 115, 135, 160][i % 5] }));

/** Jamendo et Audius répondent, chacun avec son catalogue. */
const services = () =>
  fakeNetwork({
    jamendo: () => reply(jamendoBody(jamendoCatalogue)),
    audius: () => reply(audiusBody(audiusCatalogue)),
  });

const originalFetch = global.fetch;
let open: jest.SpyInstance;

const originalEnvKey = process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;

beforeEach(() => {
  delete process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;
  stopMusic();
  clearPlaylists();
  jest.clearAllMocks();
  open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalEnvKey === undefined) delete process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;
  else process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID = originalEnvKey;
});

describe('startSessionMusic', () => {
  it('mode manuel : joue les fichiers importés dans l’application', async () => {
    const files = [
      { id: 'a', name: 'Premier', uri: 'file:///docs/music/a.mp3', kind: 'audio' as const },
      { id: 'b', name: 'Clip', uri: 'file:///docs/music/b.mp4', kind: 'video' as const },
    ];
    await startSessionMusic(target, settings({ mode: 'manual', files }));
    expect(fake.replace).toHaveBeenCalledWith({ uri: 'file:///docs/music/a.mp3', name: 'Premier' });
    expect(usePlayer.getState().queue.map((t) => t.title)).toEqual(['Premier', 'Clip']);
    expect(open).not.toHaveBeenCalled();
  });

  it('mode manuel : sans fichier, ouvre la playlist YouTube dans YouTube', async () => {
    const link = 'https://www.youtube.com/playlist?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG';
    await startSessionMusic(target, settings({ mode: 'manual', youtubeUrl: `${link}&si=zzz` }));
    expect(open).toHaveBeenCalledWith(link);
    expect(usePlayer.getState().external?.label).toBe('YouTube');
  });

  it('mode manuel : explique quoi faire quand rien n’est ajouté', async () => {
    await startSessionMusic(target, settings({ mode: 'manual', youtubeUrl: 'pas un lien' }));
    expect(usePlayer.getState().status).toBe('idle');
    expect(usePlayer.getState().message).toMatch(/Ajoute tes fichiers/);
    expect(open).not.toHaveBeenCalled();
  });

  it('automatique avec ton application : ouvre la recherche des styles choisis', async () => {
    await startSessionMusic(target, settings({ autoEngine: 'external', externalApp: 'deezer', genres: ['rock', 'pop'] }));
    expect(open).toHaveBeenCalledWith('https://www.deezer.com/search/rock%20pop%20workout/playlist');
    expect(usePlayer.getState().external).toMatchObject({ label: 'Deezer' });
  });

  it('automatique dans l’application : compose avec Audius et Jamendo puis joue la playlist', async () => {
    const fetchMock = services();
    global.fetch = fetchMock as unknown as typeof fetch;
    await startSessionMusic(target, settings({ jamendoClientId: 'cle', genres: ['hiphop', 'electro'] }));
    expect(callsTo(fetchMock, 'api.jamendo.com')).toHaveLength(2);
    expect(callsTo(fetchMock, 'api.audius.co')).toHaveLength(2);
    const state = usePlayer.getState();
    expect(state.queue.length).toBeGreaterThan(5);
    expect(state.sessionId).toBe('prog-1');
    expect(fake.play).toHaveBeenCalledTimes(1);
  });

  it('automatique dans l’application : sans clé Jamendo, joue les titres d’Audius', async () => {
    const fetchMock = services();
    global.fetch = fetchMock as unknown as typeof fetch;
    await startSessionMusic(target, settings({ jamendoClientId: '', genres: ['pop'] }));
    expect(callsTo(fetchMock, 'api.jamendo.com')).toHaveLength(0);
    expect(callsTo(fetchMock, 'api.audius.co')).toHaveLength(1);
    const { queue, message } = usePlayer.getState();
    expect(queue.length).toBeGreaterThan(5);
    expect(queue.every((t) => t.source === 'audius')).toBe(true);
    expect(queue[0].uri).toMatch(/^https:\/\/api\.audius\.co\/v1\/tracks\/.+\/stream\?app_name=Cadence$/);
    expect(message).toBeNull();
    expect(fake.replace).toHaveBeenCalledWith({ uri: queue[0].uri, name: queue[0].title });
    expect(fake.play).toHaveBeenCalledTimes(1);
  });

  it('automatique dans l’application : explique l’échec réseau', async () => {
    global.fetch = jest.fn(() => Promise.reject(new TypeError('Network request failed'))) as unknown as typeof fetch;
    await startSessionMusic(target, settings({ jamendoClientId: 'cle' }));
    expect(usePlayer.getState().status).toBe('idle');
    expect(usePlayer.getState().message).toMatch(/connexion/);
  });

  it('automatique dans l’application : explique quand les deux sources ne répondent pas', async () => {
    global.fetch = fakeNetwork({ jamendo: () => reply({}, 503), audius: () => reply({}, 500) }) as unknown as typeof fetch;
    await startSessionMusic(target, settings({ jamendoClientId: 'cle' }));
    expect(usePlayer.getState().status).toBe('idle');
    expect(usePlayer.getState().message).toMatch(/ne répondent pas/);
    expect(fake.play).not.toHaveBeenCalled();
  });

  it('ne relance pas la musique déjà en cours pour la même séance', async () => {
    const fetchMock = services();
    global.fetch = fetchMock as unknown as typeof fetch;
    await startSessionMusic(target, settings({ jamendoClientId: 'cle', genres: ['pop'] }));
    const calls = fetchMock.mock.calls.length;
    await startSessionMusic(target, settings({ jamendoClientId: 'cle', genres: ['pop'] }));
    expect(fetchMock).toHaveBeenCalledTimes(calls);
    expect(fake.play).toHaveBeenCalledTimes(1);
  });

  it('réutilise la playlist composée quand on relance la même séance', async () => {
    const fetchMock = services();
    global.fetch = fetchMock as unknown as typeof fetch;
    await startSessionMusic(target, settings({ jamendoClientId: 'cle', genres: ['pop'] }));
    stopMusic();
    await startSessionMusic(target, settings({ jamendoClientId: 'cle', genres: ['pop'] }));
    expect(callsTo(fetchMock, 'api.audius.co')).toHaveLength(1);
    expect(callsTo(fetchMock, 'api.jamendo.com')).toHaveLength(1);
    expect(fake.play).toHaveBeenCalledTimes(2);
  });

  it('abandonne la composition si la séance est quittée entre-temps', async () => {
    const releases: ((value: unknown) => void)[] = [];
    global.fetch = jest.fn(
      (url: string) =>
        new Promise((resolve) => {
          releases.push(() =>
            resolve(
              url.includes('audius')
                ? { ok: true, status: 200, json: async () => audiusBody(audiusCatalogue) }
                : { ok: true, status: 200, json: async () => jamendoBody(jamendoCatalogue) },
            ),
          );
        }),
    ) as unknown as typeof fetch;
    const pending = startSessionMusic(target, settings({ jamendoClientId: 'cle', genres: ['pop'] }));
    stopMusic();
    releases.forEach((release) => release(undefined));
    await pending;
    expect(releases).toHaveLength(2);
    expect(fake.play).not.toHaveBeenCalled();
    expect(usePlayer.getState().queue).toEqual([]);
  });
});

describe('musicSummary', () => {
  it('résume le réglage choisi', () => {
    expect(musicSummary(settings({ genres: ['hiphop', 'electro'] }))).toBe('Automatique · Hip-hop, Électro');
    expect(musicSummary(settings({ autoEngine: 'external', externalApp: 'spotify' }))).toBe('Automatique · Spotify');
    expect(musicSummary(settings({ mode: 'manual' }))).toBe('Manuel · rien d’ajouté');
    expect(musicSummary(settings({ mode: 'manual', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ' }))).toBe('Manuel · playlist YouTube');
    const one = [{ id: 'a', name: 'A', uri: 'file:///a.mp3', kind: 'audio' as const }];
    expect(musicSummary(settings({ mode: 'manual', files: one }))).toBe('Manuel · 1 fichier');
    expect(musicSummary(settings({ mode: 'manual', files: [...one, ...one] }))).toBe('Manuel · 2 fichiers');
  });
});
