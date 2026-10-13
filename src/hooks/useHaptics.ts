import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const run = (effect: () => Promise<void>): void => {
  if (Platform.OS === 'web') return;
  effect().catch(() => undefined);
};

/** Retours tactiles de la séance. Sans effet sur le web ou si le téléphone ne vibre pas. */
export const haptics = {
  /** série terminée */
  set: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** repos terminé, la série suivante commence */
  go: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** petit réglage (± 15 s, répétitions) */
  tick: () => run(() => Haptics.selectionAsync()),
};
