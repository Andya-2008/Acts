import { useEffect, useState } from 'react';

import {
  reloadAuthUser,
  userNeedsPhoneVerification,
} from '@/features/auth/services/phoneVerificationService';
import { useAuthStore } from '@/shared/stores/authStore';

type PhoneVerificationGateState = {
  ready: boolean;
  required: boolean;
};

export function useRequiresPhoneVerification(uid: string | undefined): PhoneVerificationGateState {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [ready, setReady] = useState(false);
  const [required, setRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!uid || !user) {
      setReady(true);
      setRequired(false);
      return;
    }

    setReady(false);
    void (async () => {
      try {
        const reloaded = await reloadAuthUser();
        if (cancelled) {
          return;
        }
        const authUser = reloaded ?? user;
        if (reloaded) {
          setUser(reloaded);
        }
        setRequired(await userNeedsPhoneVerification(uid, authUser));
      } catch {
        if (!cancelled) {
          try {
            setRequired(await userNeedsPhoneVerification(uid, user));
          } catch {
            setRequired(true);
          }
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, user, setUser]);

  return { ready, required };
}
