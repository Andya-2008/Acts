import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { syncAuthEmailToUserProfileIfNeeded } from '@/features/auth/services/accountCredentialsService';
import { isFirebaseWebConfigConfigured } from '@/shared/config/env';
import { getFirebaseAuth } from '@/shared/services/firebase/client';
import { clearSentryUserContext, setSentryUserContext } from '@/shared/services/sentry';
import { useAuthStore } from '@/shared/stores/authStore';
import { useCurrencyStore } from '@/shared/stores/currencyStore';

export function useAuthSubscription(): void {
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);

  useEffect(() => {
    if (!isFirebaseWebConfigConfigured()) {
      setUser(null);
      setAuthReady(true);
      return;
    }

    let lastUid: string | undefined;
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      const nextUid = nextUser?.uid;
      if (nextUid !== lastUid) {
        useCurrencyStore.getState().resetSession();
      }
      lastUid = nextUid;
      if (nextUser?.uid) {
        setSentryUserContext(nextUser.uid, nextUser.email ?? undefined, nextUser.displayName ?? undefined);
        if (nextUser.email) {
          void syncAuthEmailToUserProfileIfNeeded(nextUser.uid, nextUser.email);
        }
      } else {
        clearSentryUserContext();
      }
      setUser(nextUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, [setUser, setAuthReady]);
}
