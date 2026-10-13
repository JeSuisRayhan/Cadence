import { arrange, mulberry32 } from '../arrange';
import type { PoolTrack } from '../sources';
import type { GenreId } from '../types';

const entry = (id: number, speed: number, genre: GenreId = 'pop', artist = `A${id}`): PoolTrack => ({
  speed,
  track: { id: `t${id}`, title: `T${id}`, artist, genre, uri: `u${id}`, durationSec: 200, source: 'jamendo' },
});

describe('arrange', () => {
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
