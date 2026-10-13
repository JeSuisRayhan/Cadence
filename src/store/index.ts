import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_MUSIC, type MusicSettings } from '../music/types';
import type { Program, SessionLog } from '../domain/types';

export interface ReminderSettings {
  enabled: boolean;
  /** minutes depuis minuit */
  minutes: number;
}

export const DEFAULT_REMINDER: ReminderSettings = { enabled: true, minutes: 18 * 60 + 30 };

const MAX_LOGS = 300;

interface AppState {
  programs: Program[];
  activeProgramId: string | null;
  history: SessionLog[];
  reminder: ReminderSettings;
  music: MusicSettings;

  addProgram: (program: Program) => void;
  setActiveProgram: (id: string) => void;
  deleteProgram: (id: string) => void;
  addLog: (log: SessionLog) => void;
  setReminder: (patch: Partial<ReminderSettings>) => void;
  setMusic: (patch: Partial<MusicSettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      programs: [],
      activeProgramId: null,
      history: [],
      reminder: DEFAULT_REMINDER,
      music: DEFAULT_MUSIC,

      addProgram: (program) =>
        set((s) => ({ programs: [program, ...s.programs], activeProgramId: program.id })),

      setActiveProgram: (id) => set((s) => (s.programs.some((p) => p.id === id) ? { activeProgramId: id } : s)),

      deleteProgram: (id) =>
        set((s) => {
          const programs = s.programs.filter((p) => p.id !== id);
          const activeProgramId = s.activeProgramId === id ? (programs[0]?.id ?? null) : s.activeProgramId;
          return { programs, activeProgramId };
        }),

      addLog: (log) => set((s) => ({ history: [log, ...s.history].slice(0, MAX_LOGS) })),

      setReminder: (patch) => set((s) => ({ reminder: { ...s.reminder, ...patch } })),

      setMusic: (patch) => set((s) => ({ music: { ...s.music, ...patch } })),
    }),
    {
      name: 'cadence-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // les valeurs par défaut complètent les réglages sauvegardés avec une ancienne version de l'application
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...saved,
          reminder: { ...current.reminder, ...saved.reminder },
          music: { ...current.music, ...saved.music },
        };
      },
    },
  ),
);

/** Vrai quand les données sauvegardées sont chargées. */
export const useStoreHydrated = (): boolean =>
  useSyncExternalStore(
    (onChange) => useAppStore.persist.onFinishHydration(onChange),
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );

export const useActiveProgram = (): Program | null =>
  useAppStore((s) => s.programs.find((p) => p.id === s.activeProgramId) ?? null);

export const findSession = (programs: readonly Program[], sessionId: string) => {
  for (const program of programs) {
    const session = program.sessions.find((s) => s.id === sessionId);
    if (session) return { program, session };
  }
  return null;
};
