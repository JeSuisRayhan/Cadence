import { muscleSentence } from '../domain/labels';
import { capitalize } from '../domain/format';
import type { PlannedSession, Weekday } from '../domain/types';

/** Jour de la semaine d'Expo : 1 = dimanche … 7 = samedi. Chez nous : 0 = lundi … 6 = dimanche. */
export const expoWeekday = (weekday: Weekday): number => ((weekday + 1) % 7) + 1;

export const REMINDER_PREFIX = 'rappel-';
export const reminderId = (weekday: Weekday): string => `${REMINDER_PREFIX}${weekday}`;

export const REST_NOTIFICATION_ID = 'repos';

export const reminderContent = (session: PlannedSession, musicReady: boolean): { title: string; body: string } => ({
  title: 'C’est l’heure de ta séance',
  body:
    `${session.title}, ${session.durationMin} min. ` +
    `${capitalize(muscleSentence(session.muscles))} au programme` +
    (musicReady ? ', ta playlist est prête.' : '.'),
});
