import { energyAt, ENERGY_POINTS, speedRankFor, speedRankOf } from '../curve';

describe('courbe d’énergie', () => {
  it('démarre et finit doucement, avec un pic aux deux tiers', () => {
    expect(energyAt(0)).toBeCloseTo(0.1);
    expect(energyAt(1)).toBeCloseTo(0.08);
    expect(energyAt(0.64)).toBeCloseTo(1);
    expect(energyAt(0.3)).toBeGreaterThan(energyAt(0.15));
    expect(energyAt(0.92)).toBeLessThan(energyAt(0.8));
  });

  it('reste entre 0 et 1, même hors de la séance', () => {
    expect(energyAt(-3)).toBeCloseTo(0.1);
    expect(energyAt(12)).toBeCloseTo(0.08);
    for (const [, y] of ENERGY_POINTS) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });

  it('traduit l’énergie en vitesse Jamendo', () => {
    expect(speedRankFor(0)).toBe(0);
    expect(speedRankFor(0.5)).toBe(2);
    expect(speedRankFor(1)).toBe(4);
    expect(speedRankOf('verylow')).toBe(0);
    expect(speedRankOf('veryhigh')).toBe(4);
    expect(speedRankOf(undefined)).toBe(2);
    expect(speedRankOf('inconnue')).toBe(2);
  });
});
