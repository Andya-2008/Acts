import { create } from 'zustand';

/** Bump after skip/complete so FriendsGateGuard re-reads AsyncStorage. */
type FriendsGateRefreshSlice = {
  generation: number;
  bump: () => void;
};

export const useFriendsGateRefreshStore = create<FriendsGateRefreshSlice>((set) => ({
  generation: 0,
  bump: () => set((s) => ({ generation: s.generation + 1 })),
}));
