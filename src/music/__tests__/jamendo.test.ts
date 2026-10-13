import { arrange, composePlaylist, JamendoError, jamendoMessage, mulberry32, resolveClientId, tracksUrl, type PoolTrack } from '../jamendo';
import type { GenreId } from '../types';

const SPEEDS = ['verylow', 'low', 'medium', 'high', 'veryhigh'];

const raw = (id: number, speed: string, artist = `Artiste ${id}`, duration = 200) => ({
  id: String(id),
  name: `Titre ${id}`,
  duration,
  artist_name: artist,
  image: `https://img.example/${id}.jpg`,
  audio: `https://audio.example/${id}.mp3`,
  shareurl: `https://www.jamendo.com/track/${id}`,
  musicinfo: { speed },
});

/** 10 titres par vitesse : les identifiants 100-109 sont très lents, 200-209 lents… */
const catalogue = (offset = 0) =>
  SPEEDS.flatMap((speed, rank) => Array.from({ length: 10 }, (_, n) => raw(offset + (rank + 1) * 100 + n, speed)));

const answer = (results: unknown[]) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ headers: { status: 'success', code: 0 }, results }),
  });

const rankOf = (id: string): number => Math.floor((Number(id.replace('jamendo-', '')) % 1000) / 100) - 1;

describe('tracksUrl', () => {
  it('demande ce qu’il faut à Jamendo', () => {
    const url = new URL(tracksUrl(' ma-cle ', 'hiphop'));
    expect(url.origin + url.pathname).toBe('https://api.jamendo.com/v3.0/tracks/');
    const p = url.searchParams;
    expect(p.get('client_id')).toBe('ma-cle');
    expect(p.get('format')).toBe('json');
    expect(p.get('fuzzytags')).toBe('hiphop rap');
    expect(p.get('include')).toBe('musicinfo');
    expect(p.get('groupby')).toBe('artist_id');
    expect(p.get('audioformat')).toBe('mp32');
    expect(p.get('durationbetween')).toBe('100_360');
    expect(p.get('order')).toBe('popularity_month');
    expect(p.get('type')).toBe('single albumtrack');
    expect(p.get('limit')).toBe('40');
  });
});

describe('resolveClientId', () => {
  const original = process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;
  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;
    else process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID = original;
  });

  it('préfère la clé saisie, sinon celle de la compilation', () => {
    process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID = ' env-key ';
    expect(resolveClientId(' saisie ')).toBe('saisie');
    expect(resolveClientId('   ')).toBe('env-key');
    delete process.env.EXPO_PUBLIC_JAMENDO_CLIENT_ID;
    expect(resolveClientId('')).toBe('');
  });
});

describe('composePlaylist', () => {
  it('suit la courbe : doux au début, rapide vers les deux tiers, calme à la fin', async () => {
    const fetchImpl = jest.fn(() => answer(catalogue()));
    const playlist = await composePlaylist({
      sessionId: 's1',
      clientId: 'cle',
      genres: ['hiphop'],
      durationMin: 45,
      seed: 7,
      now: 1000,
      fetchImpl,
    });

    const ranks = playlist.tracks.map((t) => rankOf(t.id));
    const total = playlist.tracks.reduce((sum, t) => sum + t.durationSec, 0);
    expect(playlist.sessionId).toBe('s1');
    expect(playlist.createdAt).toBe(1000);
    expect(total).toBeGreaterThanOrEqual(45 * 60);
    expect(total).toBeLessThan(45 * 60 + 200);
    expect(playlist.energy).toHaveLength(playlist.tracks.length);

    expect(ranks[0]).toBeLessThanOrEqual(1);
    expect(ranks[ranks.length - 1]).toBeLessThanOrEqual(1);
    const peak = ranks.slice(Math.floor(ranks.length * 0.45), Math.ceil(ranks.length * 0.8));
    expect(Math.max(...peak)).toBeGreaterThanOrEqual(3);
    const early = ranks.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const middle = peak.reduce((a, b) => a + b, 0) / peak.length;
    expect(middle).toBeGreaterThan(early + 1.5);
  });

  it('interroge Jamendo une fois par style, avec les étiquettes de chaque style', async () => {
    const urls: string[] = [];
    const fetchImpl = jest.fn((url: string) => {
      urls.push(url);
      return answer(catalogue());
    });
    await composePlaylist({ sessionId: 's', clientId: 'cle', genres: ['rock', 'lofi', 'rock'], durationMin: 30, seed: 1, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const tags = urls.map((u) => new URL(u).searchParams.get('fuzzytags'));
    expect(tags).toEqual(['rock hardrock', 'lofi chillhop chillout']);
  });

  it('écarte les doublons, les titres sans audio et garde les infos utiles aux crédits', async () => {
    const fetchImpl = jest.fn(() =>
      answer([raw(1, 'medium'), raw(1, 'medium'), { ...raw(2, 'low'), audio: '' }, { ...raw(3, 'high'), name: '  ' }]),
    );
    const playlist = await composePlaylist({ sessionId: 's', clientId: 'cle', genres: ['pop', 'afro'], durationMin: 60, seed: 1, fetchImpl });
    const ids = playlist.tracks.map((t) => t.id).sort();
    expect(ids).toEqual(['jamendo-1', 'jamendo-3']);
    const third = playlist.tracks.find((t) => t.id === 'jamendo-3');
    expect(third?.title).toBe('Sans titre');
    const first = playlist.tracks.find((t) => t.id === 'jamendo-1');
    expect(first).toMatchObject({
      artist: 'Artiste 1',
      uri: 'https://audio.example/1.mp3',
      link: 'https://www.jamendo.com/track/1',
      artwork: 'https://img.example/1.jpg',
      source: 'jamendo',
    });
  });

  it('alterne les styles quand la vitesse ne les départage pas', async () => {
    const make = (offset: number) => Array.from({ length: 12 }, (_, n) => raw(offset + n, 'medium'));
    const fetchImpl = jest.fn((url: string) =>
      answer(new URL(url).searchParams.get('fuzzytags')?.startsWith('hiphop') ? make(100) : make(200)),
    );
    const playlist = await composePlaylist({ sessionId: 's', clientId: 'cle', genres: ['hiphop', 'electro'], durationMin: 40, seed: 3, fetchImpl });
    let sameInRow = 0;
    for (let i = 1; i < playlist.tracks.length; i += 1) {
      if (playlist.tracks[i].genre === playlist.tracks[i - 1].genre) sameInRow += 1;
    }
    expect(playlist.tracks.length).toBeGreaterThan(8);
    expect(sameInRow).toBeLessThanOrEqual(Math.floor(playlist.tracks.length / 4));
  });

  it('continue avec les styles qui répondent quand un autre échoue', async () => {
    const fetchImpl = jest.fn((url: string) =>
      new URL(url).searchParams.get('fuzzytags')?.startsWith('rock') ? Promise.reject(new TypeError('Network request failed')) : answer(catalogue()),
    );
    const playlist = await composePlaylist({ sessionId: 's', clientId: 'cle', genres: ['rock', 'pop'], durationMin: 30, seed: 1, fetchImpl });
    expect(playlist.tracks.length).toBeGreaterThan(5);
    expect(playlist.tracks.every((t) => t.genre === 'pop')).toBe(true);
  });

  it('donne la même playlist pour la même graine, une autre pour une autre graine', async () => {
    const run = async (seed: number) =>
      (await composePlaylist({ sessionId: 's', clientId: 'cle', genres: ['hiphop'], durationMin: 45, seed, fetchImpl: () => answer(catalogue()) })).tracks.map((t) => t.id);
    const a = await run(11);
    expect(await run(11)).toEqual(a);
    expect(await run(12)).not.toEqual(a);
  });

  describe('échecs', () => {
    const base = { sessionId: 's', genres: ['pop'] as GenreId[], durationMin: 30, seed: 1 };

    it('sans clé : aucune requête', async () => {
      const fetchImpl = jest.fn();
      await expect(composePlaylist({ ...base, clientId: '  ', fetchImpl })).rejects.toMatchObject({ kind: 'no-key' });
      expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('sans style choisi', async () => {
      await expect(composePlaylist({ ...base, genres: [], clientId: 'cle', fetchImpl: jest.fn() })).rejects.toMatchObject({ kind: 'empty' });
    });

    it('hors ligne', async () => {
      const fetchImpl = jest.fn(() => Promise.reject(new TypeError('Network request failed')));
      await expect(composePlaylist({ ...base, clientId: 'cle', fetchImpl })).rejects.toMatchObject({ kind: 'offline' });
    });

    it('erreur HTTP', async () => {
      const fetchImpl = jest.fn(() => Promise.resolve({ ok: false, status: 503, json: async () => ({}) }));
      await expect(composePlaylist({ ...base, clientId: 'cle', fetchImpl })).rejects.toMatchObject({ kind: 'api' });
    });

    it('réponse refusée par Jamendo (clé invalide)', async () => {
      const fetchImpl = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ headers: { status: 'failed', code: 5, error_message: 'Invalid client' }, results: [] }),
        }),
      );
      await expect(composePlaylist({ ...base, clientId: 'mauvaise', fetchImpl })).rejects.toMatchObject({ kind: 'api', message: 'Invalid client' });
    });

    it('réponse illisible', async () => {
      const fetchImpl = jest.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError('Unexpected token');
          },
        }),
      );
      await expect(composePlaylist({ ...base, clientId: 'cle', fetchImpl })).rejects.toMatchObject({ kind: 'api' });
    });

    it('catalogue vide', async () => {
      await expect(composePlaylist({ ...base, clientId: 'cle', fetchImpl: () => answer([]) })).rejects.toMatchObject({ kind: 'empty' });
    });

    it('annulée par la personne', async () => {
      const controller = new AbortController();
      const fetchImpl = jest.fn((_url: string, init?: { signal?: AbortSignal }) =>
        new Promise<never>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
      );
      const pending = composePlaylist({ ...base, clientId: 'cle', fetchImpl, signal: controller.signal });
      controller.abort();
      await expect(pending).rejects.toMatchObject({ kind: 'aborted' });
    });
  });
});

describe('arrange', () => {
  const entry = (id: number, speed: number, genre: GenreId = 'pop', artist = `A${id}`): PoolTrack => ({
    speed,
    track: { id: `t${id}`, title: `T${id}`, artist, genre, uri: `u${id}`, durationSec: 200, source: 'jamendo' },
  });

  it('s’arrête quand il n’y a plus de titres', () => {
    const { tracks } = arrange([entry(1, 2), entry(2, 3)], 3600, 1);
    expect(tracks).toHaveLength(2);
  });

  it('évite de répéter un artiste tant qu’il reste le choix', () => {
    const pool = [entry(1, 2, 'pop', 'Même'), entry(2, 2, 'pop', 'Même'), entry(3, 2, 'pop', 'Autre'), entry(4, 2, 'pop', 'Encore')];
    const { tracks } = arrange(pool, 600, 5);
    expect(new Set(tracks.map((t) => t.artist)).size).toBe(tracks.length);
  });

  it('ne dépasse pas la durée de la séance d’un titre', () => {
    const pool = Array.from({ length: 40 }, (_, i) => entry(i, i % 5));
    const { tracks } = arrange(pool, 1800, 2);
    const total = tracks.reduce((s, t) => s + t.durationSec, 0);
    expect(total).toBeGreaterThanOrEqual(1800);
    expect(total - tracks[tracks.length - 1].durationSec).toBeLessThan(1800);
  });
});

describe('mulberry32', () => {
  it('produit des nombres dans [0, 1[ toujours identiques pour une graine', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i += 1) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('jamendoMessage', () => {
  it('explique chaque échec en français', () => {
    expect(jamendoMessage(new JamendoError('no-key', ''))).toMatch(/clé Jamendo/);
    expect(jamendoMessage(new JamendoError('offline', ''))).toMatch(/connexion/);
    expect(jamendoMessage(new JamendoError('empty', ''))).toMatch(/Aucun titre/);
    expect(jamendoMessage(new JamendoError('api', ''))).toMatch(/Jamendo/);
    expect(jamendoMessage(new JamendoError('aborted', ''))).toBe('');
    expect(jamendoMessage(new Error('autre'))).toMatch(/Jamendo/);
  });
});
