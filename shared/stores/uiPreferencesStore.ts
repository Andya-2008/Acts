import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UiPreferences = {
  darkModePreference: 'system' | 'light' | 'dark';
  setDarkModePreference: (value: 'system' | 'light' | 'dark') => void;
};

export const useUiPreferencesStore = create<UiPreferences>()(
  persist(
    (set) => ({
      darkModePreference: 'system',
      setDarkModePreference: (darkModePreference) => set({ darkModePreference }),
    }),
    {
      name: 'acts-ui-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
