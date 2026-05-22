import { create } from 'zustand';

/**
 * When true, other full-screen promos (e.g. weekend double) should wait so two modals never stack.
 */
type TutorialGateSlice = {
  firstRunTutorialOpen: boolean;
  setFirstRunTutorialOpen: (open: boolean) => void;
};

export const useTutorialGateStore = create<TutorialGateSlice>((set) => ({
  firstRunTutorialOpen: false,
  setFirstRunTutorialOpen: (firstRunTutorialOpen) => set({ firstRunTutorialOpen }),
}));
