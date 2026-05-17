import type { ReactNode } from 'react';

import { useAuthSubscription } from '@/features/auth/hooks/useAuthSubscription';

export function AuthStateListener({ children }: { children: ReactNode }) {
  useAuthSubscription();
  return children;
}
