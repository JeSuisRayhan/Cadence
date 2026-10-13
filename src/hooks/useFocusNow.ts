import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/** Date du jour, rafraîchie à chaque retour sur l'écran (minuit passé, séance terminée…). */
export const useFocusNow = (): Date => {
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
    }, []),
  );
  return now;
};
