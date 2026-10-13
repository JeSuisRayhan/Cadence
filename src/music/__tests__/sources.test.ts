import { getJson, mergePools, MusicError, musicMessage, type PoolTrack } from '../sources';

const entry = (id: string): PoolTrack => ({
  speed: 2,
  track: { id, title: id, artist: id, uri: `u-${id}`, durationSec: 200, source: 'audius' },
});

const ok = (...ids: string[]): PromiseFulfilledResult<PoolTrack[]> => ({ status: 'fulfilled', value: ids.map(entry) });
const failed = (kind: ConstructorParameters<typeof MusicError>[0]): PromiseRejectedResult => ({
  status: 'rejected',
  reason: new MusicError(kind, kind),
});

describe('mergePools', () => {
  it('réunit les titres des requêtes sans doublon, dans l’ordre', () => {
    const pool = mergePools([ok('a', 'b'), ok('b', 'c'), ok()]);
    expect(pool.map((p) => p.track.id)).toEqual(['a', 'b', 'c']);
  });

  it('ignore les requêtes en échec tant qu’une autre a répondu', () => {
    expect(mergePools([failed('offline'), ok('a'), failed('api')]).map((p) => p.track.id)).toEqual(['a']);
  });

  it('remonte la vraie panne plutôt qu’une annulation', () => {
    expect(() => mergePools([failed('aborted'), failed('api'), ok()])).toThrow(expect.objectContaining({ kind: 'api' }));
  });

  it('remonte l’annulation quand elle est seule', () => {
    expect(() => mergePools([failed('aborted'), failed('aborted')])).toThrow(expect.objectContaining({ kind: 'aborted' }));
  });

  it('signale l’absence de titres quand personne n’en a donné', () => {
    expect(() => mergePools([ok(), ok()])).toThrow(expect.objectContaining({ kind: 'empty' }));
    expect(() => mergePools([])).toThrow(expect.objectContaining({ kind: 'empty' }));
  });

  it('transforme une erreur inconnue en panne de service', () => {
    const odd: PromiseRejectedResult = { status: 'rejected', reason: new TypeError('bizarre') };
    expect(() => mergePools([odd])).toThrow(expect.objectContaining({ kind: 'api' }));
  });
});

describe('musicMessage', () => {
  it('explique chaque échec en français', () => {
    expect(musicMessage(new MusicError('offline', ''))).toMatch(/connexion/);
    expect(musicMessage(new MusicError('empty', ''))).toMatch(/Aucun titre/);
    expect(musicMessage(new MusicError('api', ''))).toMatch(/ne répondent pas/);
    expect(musicMessage(new MusicError('aborted', ''))).toBe('');
    expect(musicMessage(new Error('autre'))).toMatch(/ne répondent pas/);
  });
});

describe('getJson', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('ne lance aucune requête si la demande est déjà annulée', async () => {
    const fetchImpl = jest.fn();
    const controller = new AbortController();
    controller.abort();
    await expect(getJson('https://x.example', fetchImpl, controller.signal, 'X')).rejects.toMatchObject({ kind: 'aborted' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('abandonne un service qui ne répond pas au bout de dix secondes', async () => {
    jest.useFakeTimers();
    const fetchImpl = jest.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise<never>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const pending = getJson('https://x.example', fetchImpl, undefined, 'X');
    const check = expect(pending).rejects.toMatchObject({ kind: 'offline' });
    await jest.advanceTimersByTimeAsync(10_000);
    await check;
  });

  it('nomme le service dans le message d’une erreur HTTP', async () => {
    const response = { ok: false, status: 429, json: async () => ({}) };
    await expect(getJson('https://x.example', () => Promise.resolve(response), undefined, 'Audius')).rejects.toMatchObject({
      kind: 'api',
      message: 'Audius a répondu 429',
    });
  });
});
