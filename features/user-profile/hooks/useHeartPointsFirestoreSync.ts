import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { updateUserHeartPoints } from '@/features/user-profile/services/userInfoRepository';
import { useCurrencyStore } from '@/shared/stores/currencyStore';
import type { UserInfoRead } from '@/shared/types/userInfo';

const PERSIST_DEBOUNCE_MS = 400;

/**
 * Loads heart / kindness points from `userInfo/{uid}.HeartPoints` once per session uid,
 * then persists local balance changes to Firestore (debounced).
 */
export function useHeartPointsFirestoreSync(uid: string | undefined, userInfo: UserInfoRead | null | undefined): void {
  const queryClient = useQueryClient();
  const hydratedUidRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!uid) {
      hydratedUidRef.current = null;
    }
  }, [uid]);

  useEffect(() => {
    if (!uid || userInfo === undefined) {
      return;
    }
    if (userInfo == null) {
      return;
    }
    if (hydratedUidRef.current === uid) {
      return;
    }
    const server = Math.max(0, Math.floor(Number(userInfo.HeartPoints ?? 0)));
    const local = useCurrencyStore.getState().balance;
    useCurrencyStore.getState().setBalance(Math.max(server, local));
    hydratedUidRef.current = uid;
  }, [uid, userInfo]);

  useEffect(() => {
    if (!uid) {
      return;
    }

    const schedulePersist = (balance: number) => {
      if (debounceTimerRef.current != null) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void (async () => {
          try {
            await updateUserHeartPoints(uid, balance);
            queryClient.setQueryData<UserInfoRead | null>(userInfoQueryKeys.detail(uid), (prev) =>
              prev == null ? prev : { ...prev, HeartPoints: balance },
            );
          } catch {
            /* Avoid crashing the app; balance stays local until next write. */
          }
        })();
      }, PERSIST_DEBOUNCE_MS);
    };

    const unsub = useCurrencyStore.subscribe((state, prev) => {
      if (state.balance === prev.balance) {
        return;
      }
      schedulePersist(state.balance);
    });

    return () => {
      unsub();
      if (debounceTimerRef.current != null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const balance = useCurrencyStore.getState().balance;
      void (async () => {
        try {
          await updateUserHeartPoints(uid, balance);
          queryClient.setQueryData<UserInfoRead | null>(userInfoQueryKeys.detail(uid), (prev) =>
            prev == null ? prev : { ...prev, HeartPoints: balance },
          );
        } catch {
          /* best-effort flush */
        }
      })();
    };
  }, [uid, queryClient]);
}
