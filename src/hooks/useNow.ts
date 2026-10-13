import { useEffect, useState } from 'react';

/** L'heure actuelle en millisecondes, rafraîchie toutes les `intervalMs`. Sans intervalle, elle ne bouge pas. */
export const useNow = (intervalMs: number | null): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (intervalMs === null) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};
