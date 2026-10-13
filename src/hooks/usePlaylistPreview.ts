import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jamendoMessage, resolveClientId } from '../music/jamendo';
import { cachedPlaylist, loadPlaylist, playlistKey } from '../music/playlist';
import type { ComposedPlaylist, GenreId, MusicSettings } from '../music/types';

export type PreviewState =
  | { status: 'off' }
  | { status: 'no-key' }
  | { status: 'loading' }
  | { status: 'ready'; playlist: ComposedPlaylist }
  | { status: 'error'; message: string };

export interface PreviewTarget {
  id: string;
  durationMin: number;
}

type Outcome = Extract<PreviewState, { status: 'ready' | 'error' }>;

/** Délai avant de recomposer, pour laisser le temps de choisir plusieurs styles d'affilée. */
const DEBOUNCE_MS = 350;

/**
 * La playlist que la séance jouera avec les réglages actuels : celle déjà en mémoire, sinon une nouvelle composition.
 * `refresh` en compose une autre.
 */
export const usePlaylistPreview = (
  target: PreviewTarget,
  music: Pick<MusicSettings, 'mode' | 'autoEngine' | 'genres' | 'jamendoClientId'>,
): { state: PreviewState; refresh: () => void } => {
  const enabled = music.mode === 'auto' && music.autoEngine === 'inapp';
  const clientId = resolveClientId(music.jamendoClientId);
  const genresKey = [...music.genres].sort().join(',');
  const genres = useMemo(() => genresKey.split(',').filter(Boolean) as GenreId[], [genresKey]);
  const cacheKey = playlistKey(target.id, genres, target.durationMin);
  const paramsKey = `${cacheKey}|${clientId}`;

  const [result, setResult] = useState<{ key: string; outcome: Outcome } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const inFlight = useRef<AbortController | null>(null);

  const run = useCallback(
    (refresh: boolean) => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      loadPlaylist({
        sessionId: target.id,
        durationMin: target.durationMin,
        music: { genres, jamendoClientId: clientId },
        refresh,
        signal: controller.signal,
      })
        .then((playlist) => ({ status: 'ready', playlist }) as const)
        .catch((error: unknown) => ({ status: 'error', message: jamendoMessage(error) }) as const)
        .then((outcome) => {
          if (controller.signal.aborted) return;
          setResult({ key: paramsKey, outcome });
          setRefreshing(false);
        });
    },
    [target.id, target.durationMin, genres, clientId, paramsKey],
  );

  // composition automatique quand les réglages changent et qu'aucune playlist n'est encore en mémoire
  useEffect(() => {
    if (!enabled || !clientId || cachedPlaylist(cacheKey)) return;
    const timer = setTimeout(() => run(false), DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      inFlight.current?.abort();
    };
  }, [enabled, clientId, cacheKey, run]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    run(true);
  }, [run]);

  let state: PreviewState;
  if (!enabled) state = { status: 'off' };
  else if (!clientId) state = { status: 'no-key' };
  else if (refreshing) state = { status: 'loading' };
  else if (result?.key === paramsKey) state = result.outcome;
  else {
    const hit = cachedPlaylist(cacheKey);
    state = hit ? { status: 'ready', playlist: hit } : { status: 'loading' };
  }
  return { state, refresh };
};
