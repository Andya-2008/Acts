import { create } from 'zustand';
import type { User } from 'firebase/auth';

export type LoginFlash = 'profile_missing' | null;

export type AuthSlice = {
  user: User | null;
  authReady: boolean;
  /** One-shot flag for login screen (e.g. missing Firestore profile after sign-in). */
  loginFlash: LoginFlash;
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  setLoginFlash: (flash: LoginFlash) => void;
};

export const useAuthStore = create<AuthSlice>((set) => ({
  user: null,
  authReady: false,
  loginFlash: null,
  setUser: (user) => set({ user }),
  setAuthReady: (authReady) => set({ authReady }),
  setLoginFlash: (loginFlash) => set({ loginFlash }),
}));
