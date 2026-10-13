import { createProgram } from '../../domain/generator';
import { expoWeekday, reminderContent, reminderId } from '../content';
import type { Weekday } from '../../domain/types';

describe('notifications', () => {
  it('convertit nos jours (lundi = 0) en jours Expo (dimanche = 1)', () => {
    expect(([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map(expoWeekday)).toEqual([2, 3, 4, 5, 6, 7, 1]);
  });

  it('donne des identifiants stables par jour', () => {
    expect(reminderId(2)).toBe('rappel-2');
  });

  it('écrit le texte de la maquette', () => {
    const program = createProgram(
      { muscles: ['pecs', 'epaules', 'triceps'], level: 'inter', place: 'maison', durationMin: 45, weekdays: [0] },
      0,
      'p',
    );
    const content = reminderContent(program.sessions[0], true);
    expect(content.title).toBe('C’est l’heure de ta séance');
    expect(content.body).toBe('Haut du corps, 45 min. Pecs, épaules et triceps au programme, ta playlist est prête.');
    expect(reminderContent(program.sessions[0], false).body).toBe('Haut du corps, 45 min. Pecs, épaules et triceps au programme.');
  });
});
