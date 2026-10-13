import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { useActiveProgram, useAppStore } from '../store';
import { syncReminders } from './index';

/** Garde les rappels du téléphone en phase avec le programme actif et l'heure choisie. */
export const useReminderSync = (hydrated: boolean): void => {
  const program = useActiveProgram();
  const reminder = useAppStore((s) => s.reminder);
  const musicReady = useAppStore((s) => s.music.mode === 'auto' || s.music.files.length > 0 || s.music.youtubeUrl !== null);

  useEffect(() => {
    if (!hydrated) return;
    void syncReminders(program, reminder, musicReady);
  }, [hydrated, program, reminder, musicReady]);
};

const useNativeNotificationTaps = (enabled: boolean): void => {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!enabled || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const data = response.notification.request.content.data;
    if (data?.type === 'rappel' && typeof data.sessionId === 'string') {
      router.push({ pathname: '/seance/[id]', params: { id: data.sessionId } });
    }
  }, [enabled, response, router]);
};

/** Ouvre la séance quand on touche le rappel. */
export const useNotificationTaps: (enabled: boolean) => void =
  Platform.OS === 'web' ? () => undefined : useNativeNotificationTaps;
