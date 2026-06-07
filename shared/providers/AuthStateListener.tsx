import type { ReactNode } from 'react';

import { useAuthSubscription } from '@/features/auth/hooks/useAuthSubscription';
import { useInviteAttributionCapture } from '@/features/friends/hooks/useInviteAttributionCapture';

export function AuthStateListener({ children }: { children: ReactNode }) {
  useAuthSubscription();
  useInviteAttributionCapture();
  return children;
}
