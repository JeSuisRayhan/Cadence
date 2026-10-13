import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { ensureNotificationPermission, notificationPermissionState } from '../notifications';
import { useAppStore } from '../store';

export const REMINDER_MIN = 5 * 60;
export const REMINDER_MAX = 23 * 60 + 30;
export const REMINDER_STEP = 30;

/** Réglage du rappel : l'interrupteur demande l'autorisation du téléphone au moment de l'activer. */
export const useReminderControls = () => {
  const enabled = useAppStore((s) => s.reminder.enabled);
  const minutes = useAppStore((s) => s.reminder.minutes);
  const setReminder = useAppStore((s) => s.setReminder);
  const [blocked, setBlocked] = useState(false);

  // l'autorisation peut avoir été retirée dans les réglages du téléphone
  useEffect(() => {
    if (Platform.OS === 'web' || !enabled) return;
    let cancelled = false;
    void notificationPermissionState().then((state) => {
      if (!cancelled) setBlocked(state === 'denied');
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const toggle = useCallback(
    async (next: boolean) => {
      if (!next) {
        setBlocked(false);
        setReminder({ enabled: false });
        return;
      }
      const granted = await ensureNotificationPermission();
      setBlocked(!granted && Platform.OS !== 'web');
      setReminder({ enabled: granted });
    },
    [setReminder],
  );

  const shift = useCallback(
    (direction: -1 | 1) => {
      setReminder({ minutes: Math.min(REMINDER_MAX, Math.max(REMINDER_MIN, minutes + direction * REMINDER_STEP)) });
    },
    [minutes, setReminder],
  );

  return { enabled, minutes, blocked, toggle, shift };
};
