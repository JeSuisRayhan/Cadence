import { audiusBody, audiusTrack, callsTo, fakeNetwork, jamendoBody, jamendoTrack, offline, reply } from '../__fixtures__/network';
import { composePlaylist } from '../compose';
import type { GenreId } from '../types';

const JAMENDO = 'api.jamendo.com';
const AUDIUS = 'api.audius.co';
const SPEEDS = ['verylow', 'low', 'medium', 'high', 'veryhigh'];
/** rythmes qui donnent, côté Audius, les vitesses 0 à 4 */
const BPMS = [70, 95, 115, 135, 160];

/** 10 titres Jamendo par vitesse : les identifiants 100-109 sont très lents, 200-209 lents… */
const jamendoCatalogue = () =>
  SPEEDS.flatMap((speed, rank) => Array.from({ length: 10 }, (_, n) => jamendoTrack((rank + 1) * 100 + n, speed)));

/** 10 titres Audius par vitesse, sans humeur pour que le rythme décide. */
const audiusCatalogue = () =>
  BPMS.flatMap((bpm, rank) => Array.from({ length: 10 }, (_, n) => audiusTrack(`a${rank}${n}`, { mood: null, bpm })));

const rankOf = (id: string): number =>
  id.startsWith('jamendo-') ? Math.floor((Number(id.replace('jamendo-', '')) % 1000) / 100) - 1 : Number(id.replace('audius-a', '')[0]);

const both = () =>
  fakeNetwork({
    jamendo: () => reply(jamendoBody(jamendoCatalogue())),
    audius: () => reply(audiusBody(audiusCatalogue())),
  });

const base = { sessionId: 's', clientId: 'cle', durationMin: 45, seed: 7 };

describe('composePlaylist', () => {
  it('suit la courbe : doux au début, rapide vers les deux tiers, calme à la fin', async () => {
    const fetchImpl = fakeNetwork({ jamendo: () => reply(jamendoBody(jamendoCatalogue())), audius: () => reply(audiusBody([])) });
    const playlist = await composePlaylist({ ...base, genres: ['hiphop'], now: 1000, fetchImpl });

    const ranks = playlist.tracks.map((t) => rankOf(t.id));
    const total = playlist.tracks.reduce((sum, t) => sum + t.durationSec, 0);
    expect(playlist.sessionId).toBe('s');
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

  it('suit aussi la courbe avec les titres d’Audius seul', async () => {
    const fetchImpl = fakeNetwork({ audius: () => reply(audiusBody(audiusCatalogue())) });
    const playlist = await composePlaylist({ ...base, clientId: '', genres: ['electro'], fetchImpl });
    const ranks = playlist.tracks.map((t) => rankOf(t.id));
    const peak = ranks.slice(Math.floor(ranks.length * 0.45), Math.ceil(ranks.length * 0.8));
    expect(ranks[0]).toBeLessThanOrEqual(1);
    expect(ranks[ranks.length - 1]).toBeLessThanOrEqual(1);
    expect(Math.max(...peak)).toBeGreaterThanOrEqual(3);
  });

  describe('sources', () => {
    it('sans clé Jamendo : interroge Audius seul', async () => {
      const fetchImpl = both();
      const playlist = await composePlaylist({ ...base, clientId: '   ', genres: ['hiphop', 'electro'], fetchImpl });
      expect(callsTo(fetchImpl, JAMENDO)).toHaveLength(0);
      expect(callsTo(fetchImpl, AUDIUS)).toHaveLength(2);
      expect(playlist.tracks.length).toBeGreaterThan(5);
      expect(playlist.tracks.every((t) => t.source === 'audius')).toBe(true);
    });

    it('avec la clé Jamendo : réunit les deux catalogues', async () => {
      const fetchImpl = both();
      const playlist = await composePlaylist({ ...base, genres: ['pop'], fetchImpl });
      const sources = new Set(playlist.tracks.map((t) => t.source));
      expect(sources).toEqual(new Set(['jamendo', 'audius']));
    });

    it('interroge chaque source une fois par style, avec les paramètres de chaque style', async () => {
      const fetchImpl = both();
      await composePlaylist({ ...base, genres: ['rock', 'lofi', 'rock'], fetchImpl });
      expect(callsTo(fetchImpl, JAMENDO).map((u) => u.searchParams.get('fuzzytags'))).toEqual(['rock hardrock', 'lofi chillhop chillout']);
      expect(callsTo(fetchImpl, AUDIUS).map((u) => u.searchParams.get('genre'))).toEqual(['Rock', 'Lo-Fi']);
    });

    it('ne garde qu’une fois un titre renvoyé pour plusieurs styles', async () => {
      const fetchImpl = fakeNetwork({
        jamendo: () => reply(jamendoBody([jamendoTrack(1, 'high'), jamendoTrack(2, 'low')])),
        audius: () => reply(audiusBody([audiusTrack('x1'), audiusTrack('x2')])),
      });
      const playlist = await composePlaylist({ ...base, durationMin: 120, genres: ['pop', 'afro'], fetchImpl });
      const ids = playlist.tracks.map((t) => t.id).sort();
      expect(ids).toEqual(['audius-x1', 'audius-x2', 'jamendo-1', 'jamendo-2']);
    });

    it('alterne les styles quand la vitesse ne les départage pas', async () => {
      const medium = (offset: number) => Array.from({ length: 12 }, (_, n) => jamendoTrack(offset + n, 'medium'));
      const fetchImpl = fakeNetwork({
        jamendo: (url) => reply(jamendoBody(url.searchParams.get('fuzzytags')?.startsWith('hiphop') ? medium(100) : medium(200))),
        audius: () => reply(audiusBody([])),
      });
      const playlist = await composePlaylist({ ...base, durationMin: 40, seed: 3, genres: ['hiphop', 'electro'], fetchImpl });
      let sameInRow = 0;
      for (let i = 1; i < playlist.tracks.length; i += 1) {
        if (playlist.tracks[i].genre === playlist.tracks[i - 1].genre) sameInRow += 1;
      }
      expect(playlist.tracks.length).toBeGreaterThan(8);
      expect(sameInRow).toBeLessThanOrEqual(Math.floor(playlist.tracks.length / 4));
    });
  });

  describe('une source ou un style en panne', () => {
    it('Audius répond quand Jamendo ne répond pas', async () => {
      const fetchImpl = fakeNetwork({ jamendo: () => reply({}, 503), audius: () => reply(audiusBody(audiusCatalogue())) });
      const playlist = await composePlaylist({ ...base, genres: ['pop'], fetchImpl });
      expect(playlist.tracks.length).toBeGreaterThan(5);
      expect(playlist.tracks.every((t) => t.source === 'audius')).toBe(true);
    });

    it('Audius répond quand la clé Jamendo est refusée', async () => {
      const refused = () => reply({ headers: { status: 'failed', code: 5, error_message: 'Invalid client' }, results: [] });
      const fetchImpl = fakeNetwork({ jamendo: refused, audius: () => reply(audiusBody(audiusCatalogue())) });
      const playlist = await composePlaylist({ ...base, clientId: 'mauvaise', genres: ['pop'], fetchImpl });
      expect(playlist.tracks.every((t) => t.source === 'audius')).toBe(true);
    });

    it('Jamendo répond quand Audius ne répond pas', async () => {
      const fetchImpl = fakeNetwork({ jamendo: () => reply(jamendoBody(jamendoCatalogue())), audius: () => reply({ error: 'oops' }, 500) });
      const playlist = await composePlaylist({ ...base, genres: ['pop'], fetchImpl });
      expect(playlist.tracks.length).toBeGreaterThan(5);
      expect(playlist.tracks.every((t) => t.source === 'jamendo')).toBe(true);
    });

    it('continue avec les styles qui répondent quand un autre échoue', async () => {
      const fetchImpl = fakeNetwork({
        jamendo: (url) => (url.searchParams.get('fuzzytags')?.startsWith('rock') ? offline() : reply(jamendoBody(jamendoCatalogue()))),
        audius: (url) => (url.searchParams.get('genre') === 'Rock' ? offline() : reply(audiusBody(audiusCatalogue()))),
      });
      const playlist = await composePlaylist({ ...base, durationMin: 30, genres: ['rock', 'pop'], fetchImpl });
      expect(playlist.tracks.length).toBeGreaterThan(5);
      expect(playlist.tracks.every((t) => t.genre === 'pop')).toBe(true);
    });
  });

  it('donne la même playlist pour la même graine, une autre pour une autre graine', async () => {
    const run = async (seed: number) =>
      (await composePlaylist({ ...base, genres: ['hiphop'], seed, fetchImpl: both() })).tracks.map((t) => t.id);
    const a = await run(11);
    expect(await run(11)).toEqual(a);
    expect(await run(12)).not.toEqual(a);
  });

  describe('échecs', () => {
    const genres: GenreId[] = ['pop'];

    it('sans style choisi : aucune requête', async () => {
      const fetchImpl = fakeNetwork({});
      await expect(composePlaylist({ ...base, genres: [], fetchImpl })).rejects.toMatchObject({ kind: 'empty' });
      expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('hors ligne', async () => {
      const fetchImpl = fakeNetwork({ jamendo: offline, audius: offline });
      await expect(composePlaylist({ ...base, genres, fetchImpl })).rejects.toMatchObject({ kind: 'offline' });
    });

    it('hors ligne sans clé Jamendo', async () => {
      const fetchImpl = fakeNetwork({ audius: offline });
      await expect(composePlaylist({ ...base, clientId: '', genres, fetchImpl })).rejects.toMatchObject({ kind: 'offline' });
    });

    it('les deux services répondent par une erreur', async () => {
      const fetchImpl = fakeNetwork({ jamendo: () => reply({}, 503), audius: () => reply({}, 502) });
      await expect(composePlaylist({ ...base, genres, fetchImpl })).rejects.toMatchObject({ kind: 'api' });
    });

    it('aucun titre nulle part', async () => {
      const fetchImpl = fakeNetwork({ jamendo: () => reply(jamendoBody([])), audius: () => reply(audiusBody([])) });
      await expect(composePlaylist({ ...base, genres, fetchImpl })).rejects.toMatchObject({ kind: 'empty' });
    });

    it('un service vide et l’autre en panne : on dit que ça ne répond pas', async () => {
      const fetchImpl = fakeNetwork({ jamendo: () => reply(jamendoBody([])), audius: () => reply({}, 500) });
      await expect(composePlaylist({ ...base, genres, fetchImpl })).rejects.toMatchObject({ kind: 'api' });
    });

    it('annulée par la personne', async () => {
      const controller = new AbortController();
      const never = jest.fn(
        (_url: string, init?: { signal?: AbortSignal }) =>
          new Promise<never>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      );
      const pending = composePlaylist({ ...base, genres, fetchImpl: never, signal: controller.signal });
      controller.abort();
      await expect(pending).rejects.toMatchObject({ kind: 'aborted' });
      expect(never).toHaveBeenCalledTimes(2);
    });
  });
});
