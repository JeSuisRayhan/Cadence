import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useDraft } from '../store/draft';

/** Ouvre la création d'un programme avec un brouillon vierge. */
export const useStartCreation = (): (() => void) => {
  const router = useRouter();
  return useCallback(() => {
    useDraft.getState().reset();
    router.push('/creation');
  }, [router]);
};
