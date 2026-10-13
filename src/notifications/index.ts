import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WEEKDAYS } from '../domain/labels';
import type { Program } from '../domain/types';
import type { ReminderSettings } from '../store';
import { expoWeekday, REST_NOTIFICATION_ID, reminderContent, reminderId } from './content';

const supported = Platform.OS !== 'web';

const REMINDER_CHANNEL = 'rappel';
const REST_CHANNEL = 'repos';

let channelsReady: Promise<void> | null = null;

/** Crée les canaux Android (sans effet ailleurs). */
const ensureChannels = (): Promise<void> => {
  if (!supported) return Promise.resolve();
  channelsReady ??= (async () => {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Rappel de séance',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#FF6A3D',
    });
    await Notifications.setNotificationChannelAsync(REST_CHANNEL, {
      name: 'Fin du repos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#8FD3E8',
    });
  })();
  return channelsReady;
};

/** À appeler une fois au démarrage : les notifications reçues pendant que l'application est ouverte s'affichent aussi. */
export const configureNotifications = (): void => {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  void ensureChannels();
};

export type PermissionState = 'granted' | 'undetermined' | 'denied';

/** État de l'autorisation : « undetermined » tant qu'on n'a pas encore pu la demander. */
export const notificationPermissionState = async (): Promise<PermissionState> => {
  if (!supported) return 'undetermined';
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    return current.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'undetermined';
  }
};

export const hasNotificationPermission = async (): Promise<boolean> => {
  if (!supported) return false;
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
};

/** Demande l'autorisation si besoin. Renvoie vrai si les notifications sont autorisées. */
export const ensureNotificationPermission = async (): Promise<boolean> => {
  if (!supported) return false;
  try {
    await ensureChannels();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
};

const cancelReminders = async (): Promise<void> => {
  await Promise.all(WEEKDAYS.map((d) => Notifications.cancelScheduledNotificationAsync(reminderId(d)).catch(() => undefined)));
};

/**
 * Programme un rappel hebdomadaire pour chaque jour de séance, à l'heure choisie.
 * Les rappels existants sont d'abord annulés : l'appel est idempotent.
 */
export const syncReminders = async (
  program: Program | null,
  reminder: ReminderSettings,
  musicReady: boolean,
): Promise<void> => {
  if (!supported) return;
  try {
    await cancelReminders();
    if (!program || !reminder.enabled) return;
    if (!(await hasNotificationPermission())) return;
    await ensureChannels();

    const hour = Math.floor(reminder.minutes / 60);
    const minute = reminder.minutes % 60;
    for (const session of program.sessions) {
      const { title, body } = reminderContent(session, musicReady);
      await Notifications.scheduleNotificationAsync({
        identifier: reminderId(session.weekday),
        content: {
          title,
          body,
          color: '#FF6A3D',
          data: { type: 'rappel', sessionId: session.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: expoWeekday(session.weekday),
          hour,
          minute,
          channelId: REMINDER_CHANNEL,
        },
      });
    }
  } catch {
    // les rappels sont un confort : une erreur de planification ne doit jamais bloquer l'application
  }
};

/** Prévient la personne que le repos est terminé quand l'application est en arrière-plan. */
export const scheduleRestEnd = async (seconds: number, body: string): Promise<void> => {
  if (!supported || seconds < 1) return;
  try {
    if (!(await hasNotificationPermission())) return;
    await ensureChannels();
    await Notifications.cancelScheduledNotificationAsync(REST_NOTIFICATION_ID).catch(() => undefined);
    await Notifications.scheduleNotificationAsync({
      identifier: REST_NOTIFICATION_ID,
      content: { title: 'Repos terminé', body, color: '#8FD3E8', data: { type: 'repos' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.ceil(seconds),
        channelId: REST_CHANNEL,
      },
    });
  } catch {
    // voir ci-dessus
  }
};

export const cancelRestEnd = async (): Promise<void> => {
  if (!supported) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(REST_NOTIFICATION_ID);
    await Notifications.dismissNotificationAsync(REST_NOTIFICATION_ID);
  } catch {
    // rien à annuler
  }
};

