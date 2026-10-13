import { audiusBody, audiusTrack, callsTo, fakeNetwork, jamendoBody, jamendoTrack, reply } from '../__fixtures__/network';
import { cachedPlaylist, clearPlaylists, loadPlaylist, playlistKey } from '../playlist';

const network = () =>
  fakeNetwork({
    jamendo: () => reply(jamendoBody(Array.from({ length: 20 }, (_, i) => jamendoTrack(i, 'medium')))),
    audius: () => reply(audiusBody(Array.from({ length: 20 }, (_, i) => audiusTrack(`a${i}`)))),
  });

/** Avec un seul style, chaque composition interroge Audius une fois. */
const compositions = (fetchMock: ReturnType<typeof network>) => callsTo(fetchMock, 'api.audius.co').length;

const originalFetch = global.fetch;
const originalEnvKey = process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;
const music = { genres: ['pop' as const], jamendoClientId: 'cle' };

beforeEach(() => {
  delete process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalEnvKey === undefined) delete process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;
  else process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID = originalEnvKey;
  clearPlaylists();
});

describe('playlist en mémoire', () => {
  it('garde la playlist d’une séance et la recompose sur demande', async () => {
    const fetchMock = network();
    global.fetch = fetchMock as unknown as typeof fetch;

    const first = await loadPlaylist({ sessionId: 's1', durationMin: 45, music });
    const second = await loadPlaylist({ sessionId: 's1', durationMin: 45, music });
    expect(second).toBe(first);
    expect(compositions(fetchMock)).toBe(1);

    const fresh = await loadPlaylist({ sessionId: 's1', durationMin: 45, music, refresh: true });
    expect(fresh).not.toBe(first);
    expect(compositions(fetchMock)).toBe(2);
    expect(await loadPlaylist({ sessionId: 's1', durationMin: 45, music })).toBe(fresh);
  });

  it('recompose quand les styles ou la durée changent', async () => {
    const fetchMock = network();
    global.fetch = fetchMock as unknown as typeof fetch;
    await loadPlaylist({ sessionId: 's1', durationMin: 45, music });
    await loadPlaylist({ sessionId: 's1', durationMin: 45, music: { ...music, genres: ['rock'] } });
    await loadPlaylist({ sessionId: 's1', durationMin: 60, music });
    await loadPlaylist({ sessionId: 's2', durationMin: 45, music });
    expect(compositions(fetchMock)).toBe(4);
  });

  it('recompose quand la clé Jamendo est ajoutée, changée ou retirée', async () => {
    const fetchMock = network();
    global.fetch = fetchMock as unknown as typeof fetch;
    const withKey = (jamendoClientId: string) => ({ ...music, jamendoClientId });

    const noKey = await loadPlaylist({ sessionId: 's1', durationMin: 45, music: withKey('') });
    expect(noKey.tracks.every((t) => t.source === 'audius')).toBe(true);
    expect(callsTo(fetchMock, 'api.jamendo.com')).toHaveLength(0);

    const added = await loadPlaylist({ sessionId: 's1', durationMin: 45, music: withKey('cle') });
    expect(added).not.toBe(noKey);
    expect(added.tracks.some((t) => t.source === 'jamendo')).toBe(true);
    expect(await loadPlaylist({ sessionId: 's1', durationMin: 45, music: withKey('cle') })).toBe(added);

    await loadPlaylist({ sessionId: 's1', durationMin: 45, music: withKey('autre') });
    expect(compositions(fetchMock)).toBe(3);
  });

  it('oublie la playlist après trois heures', async () => {
    global.fetch = network() as unknown as typeof fetch;
    const playlist = await loadPlaylist({ sessionId: 's1', durationMin: 45, music });
    const key = playlistKey('s1', music.genres, 45, 'cle');
    expect(cachedPlaylist(key, playlist.createdAt + 2 * 60 * 60 * 1000)).toBe(playlist);
    expect(cachedPlaylist(key, playlist.createdAt + 3 * 60 * 60 * 1000 + 1)).toBeNull();
    expect(cachedPlaylist(key)).toBeNull();
  });

  it('la clé ne dépend pas de l’ordre des styles', () => {
    expect(playlistKey('s', ['pop', 'rock'], 45)).toBe(playlistKey('s', ['rock', 'pop'], 45));
  });

  it('la clé dépend de la clé Jamendo', () => {
    expect(playlistKey('s', ['pop'], 45, 'a')).not.toBe(playlistKey('s', ['pop'], 45, 'b'));
    expect(playlistKey('s', ['pop'], 45, '')).not.toBe(playlistKey('s', ['pop'], 45, 'a'));
  });
});
