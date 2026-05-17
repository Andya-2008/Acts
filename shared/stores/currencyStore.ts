import { create } from 'zustand';

export type PillAnchor = { x: number; y: number };

type CurrencyState = {
  /** In-app currency balance (e.g. kindness points). */
  balance: number;
  /** Screen-space center of the currency “sink” (heart area), for reward flight. */
  pillAnchor: PillAnchor | null;
  setPillAnchor: (next: PillAnchor | null) => void;
  setBalance: (next: number) => void;
  /** Add or subtract currency; balance is floored and clamped at 0. */
  adjustBalance: (delta: number) => void;
  /** Clear local balance when switching or signing out of Firebase users (balance is not persisted server-side). */
  resetSession: () => void;
};

export const useCurrencyStore = create<CurrencyState>((set) => ({
  balance: 0,
  pillAnchor: null,
  setPillAnchor: (pillAnchor) => set({ pillAnchor }),
  setBalance: (balance) => set({ balance: Math.max(0, Math.floor(balance)) }),
  resetSession: () => set({ balance: 0, pillAnchor: null }),
  adjustBalance: (delta) =>
    set((s) => {
      const d = Math.trunc(delta);
      if (d === 0) {
        return s;
      }
      const next = Math.max(0, s.balance + d);
      return { balance: next };
    }),
}));
