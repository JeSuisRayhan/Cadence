import { jamendoBody, jamendoTrack as raw, offline, reply } from '../__fixtures__/network';
import { fetchJamendoGenre, resolveClientId, tracksUrl } from '../jamendo';

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

describe('fetchJamendoGenre', () => {
  const fetchOf = (results: unknown[]) => jest.fn(() => reply(jamendoBody(results)));

  it('garde les infos utiles aux crédits et écarte les titres sans audio', async () => {
    const pool = await fetchJamendoGenre('cle', 'pop', fetchOf([raw(1, 'high'), { ...raw(2, 'low'), audio: '' }, { ...raw(3, 'low'), name: '  ' }]));
    expect(pool.map((p) => p.track.id)).toEqual(['jamendo-1', 'jamendo-3']);
    expect(pool[0]).toMatchObject({
      speed: 3,
      track: {
        title: 'Titre 1',
        artist: 'Artiste 1',
        genre: 'pop',
        uri: 'https://audio.example/1.mp3',
        durationSec: 200,
        link: 'https://www.jamendo.com/track/1',
        artwork: 'https://img.example/1.jpg',
        source: 'jamendo',
      },
    });
    expect(pool[1].track.title).toBe('Sans titre');
  });

  it('prend la vitesse du milieu quand Jamendo ne la donne pas, et une durée moyenne si elle manque', async () => {
    const [entry] = await fetchJamendoGenre('cle', 'rock', fetchOf([{ ...raw(7, 'medium'), musicinfo: undefined, duration: undefined }]));
    expect(entry.speed).toBe(2);
    expect(entry.track.durationSec).toBe(210);
  });

  describe('échecs', () => {
    it('hors ligne', async () => {
      await expect(fetchJamendoGenre('cle', 'pop', offline)).rejects.toMatchObject({ kind: 'offline' });
    });

    it('erreur HTTP', async () => {
      await expect(fetchJamendoGenre('cle', 'pop', () => reply({}, 503))).rejects.toMatchObject({ kind: 'api' });
    });

    it('réponse refusée par Jamendo (clé invalide)', async () => {
      const refused = () => reply({ headers: { status: 'failed', code: 5, error_message: 'Invalid client' }, results: [] });
      await expect(fetchJamendoGenre('mauvaise', 'pop', refused)).rejects.toMatchObject({ kind: 'api', message: 'Invalid client' });
    });

    it('réponse illisible', async () => {
      const unreadable = () =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError('Unexpected token');
          },
        });
      await expect(fetchJamendoGenre('cle', 'pop', unreadable)).rejects.toMatchObject({ kind: 'api' });
    });
  });
});
