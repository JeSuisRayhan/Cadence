import { cachedPlaylist, clearPlaylists, loadPlaylist, playlistKey } from '../playlist';

const answer = () =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({
      headers: { status: 'success' },
      results: Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        name: `T${i}`,
        duration: 200,
        artist_name: `A${i}`,
        audio: `https://audio.example/${i}.mp3`,
        musicinfo: { speed: 'medium' },
      })),
    }),
  });

const originalFetch = global.fetch;
const music = { genres: ['pop' as const], jamendoClientId: 'cle' };

afterEach(() => {
  global.fetch = originalFetch;
  clearPlaylists();
});

describe('playlist en mémoire', () => {
  it('garde la playlist d’une séance et la recompose sur demande', async () => {
    const fetchMock = jest.fn(answer);
    global.fetch = fetchMock as unknown as typeof fetch;

    const first = await loadPlaylist({ sessionId: 's1', durationMin: 45, music });
    const second = await loadPlaylist({ sessionId: 's1', durationMin: 45, music });
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const fresh = await loadPlaylist({ sessionId: 's1', durationMin: 45, music, refresh: true });
    expect(fresh).not.toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await loadPlaylist({ sessionId: 's1', durationMin: 45, music })).toBe(fresh);
  });

  it('recompose quand les styles ou la durée changent', async () => {
    const fetchMock = jest.fn(answer);
    global.fetch = fetchMock as unknown as typeof fetch;
    await loadPlaylist({ sessionId: 's1', durationMin: 45, music });
    await loadPlaylist({ sessionId: 's1', durationMin: 45, music: { ...music, genres: ['rock'] } });
    await loadPlaylist({ sessionId: 's1', durationMin: 60, music });
    await loadPlaylist({ sessionId: 's2', durationMin: 45, music });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('oublie la playlist après trois heures', async () => {
    global.fetch = jest.fn(answer) as unknown as typeof fetch;
    const playlist = await loadPlaylist({ sessionId: 's1', durationMin: 45, music });
    const key = playlistKey('s1', music.genres, 45);
    expect(cachedPlaylist(key, playlist.createdAt + 2 * 60 * 60 * 1000)).toBe(playlist);
    expect(cachedPlaylist(key, playlist.createdAt + 3 * 60 * 60 * 1000 + 1)).toBeNull();
    expect(cachedPlaylist(key)).toBeNull();
  });

  it('la clé ne dépend pas de l’ordre des styles', () => {
    expect(playlistKey('s', ['pop', 'rock'], 45)).toBe(playlistKey('s', ['rock', 'pop'], 45));
  });
});
