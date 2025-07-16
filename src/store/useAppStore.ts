// src/store/useAppStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  id?:            string;
  name?:          string;
  email?:         string;
  walletAddress?: string;
};

type AppState = {
  user?: User;
  _hasHydrated: boolean;

  setUser:   (u: Partial<User> | ((prev?: User) => User)) => void;
  resetUser: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user:        undefined,
      _hasHydrated: false,

      /** Merge patch or functional update */
      setUser: (patch) =>
        set((state) => ({
          user:
            typeof patch === 'function'
              ? patch(state.user)
              : { ...state.user, ...patch },
        })),

      /** Clear everything (e.g. on logout) */
      resetUser: () =>
        set({
          user: undefined,
        }),
    }),
    {
      name: 'trev-mobile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        // once rehydration completes, flip the flag
        if (state) state._hasHydrated = true;
      },
    },
  ),
);
