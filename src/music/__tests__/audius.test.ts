import { audiusBody, audiusTrack as raw, offline, reply } from '../__fixtures__/network';
import { audiusSpeedRank, audiusStreamUrl, audiusTracksUrl, fetchAudiusGenre } from '../audius';

describe('audiusTracksUrl', () => {
  it('demande les titres du moment d’un style Audius', () => {
    const url = new URL(audiusTracksUrl('hiphop'));
    expect(url.origin + url.pathname).toBe('https://api.audius.co/v1/tracks/trending');
    const p = url.searchParams;
    expect(p.get('genre')).toBe('Hip-Hop/Rap');
    expect(p.get('time')).toBe('month');
    expect(p.get('limit')).toBe('40');
    expect(p.get('app_name')).toBe('Cadence');
    expect(p.has('api_key')).toBe(false);
  });

  it('utilise le bon nom de style pour chaque goût', () => {
    const genreOf = (id: Parameters<typeof audiusTracksUrl>[0]) => new URL(audiusTracksUrl(id)).searchParams.get('genre');
    expect(genreOf('electro')).toBe('Electronic');
    expect(genreOf('rock')).toBe('Rock');
    expect(genreOf('pop')).toBe('Pop');
    expect(genreOf('lofi')).toBe('Lo-Fi');
  });

  it('cherche par mot-clé quand Audius n’a pas de style équivalent', () => {
    const url = new URL(audiusTracksUrl('afro'));
    expect(url.pathname).toBe('/v1/tracks/search');
    expect(url.searchParams.get('query')).toBe('afrobeats');
    expect(url.searchParams.get('sort_method')).toBe('popular');
    expect(url.searchParams.has('genre')).toBe(false);
  });
});

describe('audiusStreamUrl', () => {
  it('pointe vers la lecture du titre, qu’Audius redirige vers le fichier audio', () => {
    expect(audiusStreamUrl('amvQrAg')).toBe('https://api.audius.co/v1/tracks/amvQrAg/stream?app_name=Cadence');
    expect(audiusStreamUrl('a/b?c')).toBe('https://api.audius.co/v1/tracks/a%2Fb%3Fc/stream?app_name=Cadence');
  });
});

describe('audiusSpeedRank', () => {
  it('déduit la vitesse de l’humeur', () => {
    expect(audiusSpeedRank('Aggressive', undefined)).toBe(4);
    expect(audiusSpeedRank('Upbeat', null)).toBe(3);
    expect(audiusSpeedRank('Cool', undefined)).toBe(2);
    expect(audiusSpeedRank('Easygoing', undefined)).toBe(1);
    expect(audiusSpeedRank('Peaceful', undefined)).toBe(0);
  });

  it('déduit la vitesse du rythme quand il n’y a pas d’humeur', () => {
    expect(audiusSpeedRank(null, 70)).toBe(0);
    expect(audiusSpeedRank(null, 95)).toBe(1);
    expect(audiusSpeedRank(null, 115)).toBe(2);
    expect(audiusSpeedRank(null, 134)).toBe(3);
    expect(audiusSpeedRank(null, 170)).toBe(4);
  });

  it('fait la moyenne de l’humeur et du rythme', () => {
    expect(audiusSpeedRank('Gritty', 134)).toBe(3);
    expect(audiusSpeedRank('Peaceful', 80)).toBe(0);
    // un hip-hop lent mais agressif reste plutôt intense
    expect(audiusSpeedRank('Aggressive', 90)).toBe(3);
  });

  it('reste au milieu sans information exploitable', () => {
    expect(audiusSpeedRank(null, null)).toBe(2);
    expect(audiusSpeedRank('Humeur inconnue', 0)).toBe(2);
    expect(audiusSpeedRank(undefined, Number.NaN)).toBe(2);
  });
});

describe('fetchAudiusGenre', () => {
  const fetchOf = (data: unknown[]) => jest.fn(() => reply(audiusBody(data)));

  it('transforme un titre Audius en titre jouable, avec ses crédits', async () => {
    const [entry] = await fetchAudiusGenre('electro', fetchOf([raw('amvQrAg', { duration: 201.6, mood: 'Gritty', bpm: 134 })]));
    expect(entry.speed).toBe(3);
    expect(entry.track).toEqual({
      id: 'audius-amvQrAg',
      title: 'Morceau amvQrAg',
      artist: 'Artiste amvQrAg',
      genre: 'electro',
      uri: 'https://api.audius.co/v1/tracks/amvQrAg/stream?app_name=Cadence',
      durationSec: 202,
      artwork: 'https://art.example/amvQrAg/480.jpg',
      link: 'https://audius.co/artiste-amvQrAg/morceau-amvQrAg',
      source: 'audius',
    });
  });

  it('écarte les titres qu’on ne pourrait pas lire', async () => {
    const data = [
      raw('ok'),
      raw('nostream', { is_streamable: false }),
      raw('unlisted', { is_unlisted: true }),
      raw('deleted', { is_delete: true }),
      raw('noaccess', { access: { stream: false, download: false } }),
      raw('gated', { stream_conditions: { usdc_purchase: { price: 100 } } }),
      { ...raw('noid'), id: '' },
      null,
      'pas un titre',
    ];
    const pool = await fetchAudiusGenre('pop', fetchOf(data));
    expect(pool.map((p) => p.track.id)).toEqual(['audius-ok']);
  });

  it('écarte les extraits et les mix de plusieurs heures', async () => {
    const data = [raw('court', { duration: 99 }), raw('mini', { duration: 100 }), raw('maxi', { duration: 360 }), raw('mix', { duration: 361 }), raw('radio', { duration: 7001 }), raw('nan', { duration: null })];
    const pool = await fetchAudiusGenre('lofi', fetchOf(data));
    expect(pool.map((p) => p.track.id)).toEqual(['audius-mini', 'audius-maxi']);
  });

  it('se débrouille avec les infos manquantes', async () => {
    const bare = raw('nu', { title: '  ', user: { handle: ' pseudo ' }, artwork: { '150x150': 'https://art.example/petit.jpg' }, permalink: 'sans-slash', mood: null, bpm: null });
    const anonymous = raw('anonyme', { user: null, artwork: null, permalink: undefined });
    const [first, second] = await fetchAudiusGenre('rock', fetchOf([bare, anonymous]));
    expect(first.track).toMatchObject({ title: 'Sans titre', artist: 'pseudo', artwork: 'https://art.example/petit.jpg', link: undefined });
    expect(first.speed).toBe(2);
    expect(second.track).toMatchObject({ artist: 'Artiste inconnu', artwork: undefined, link: undefined });
  });

  describe('échecs', () => {
    it('hors ligne', async () => {
      await expect(fetchAudiusGenre('pop', offline)).rejects.toMatchObject({ kind: 'offline' });
    });

    it('erreur HTTP', async () => {
      await expect(fetchAudiusGenre('pop', () => reply({ error: 'oops' }, 500))).rejects.toMatchObject({ kind: 'api' });
    });

    it('réponse sans liste de titres', async () => {
      await expect(fetchAudiusGenre('pop', () => reply({ error: 'oops' }))).rejects.toMatchObject({ kind: 'api' });
      await expect(fetchAudiusGenre('pop', () => reply(null))).rejects.toMatchObject({ kind: 'api' });
    });

    it('aucun titre pour ce style', async () => {
      expect(await fetchAudiusGenre('pop', fetchOf([]))).toEqual([]);
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
      await expect(fetchAudiusGenre('pop', unreadable)).rejects.toMatchObject({ kind: 'api' });
    });
  });
});
