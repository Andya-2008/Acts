import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { easUpdateIdentity } from '@/features/app-update/easUpdateIdentity';
import {
  getDismissedEasUpdateId,
  setDismissedEasUpdateId,
} from '@/features/app-update/easUpdateDismissStorage';
import { isEasUpdateSupported } from '@/features/app-update/isEasUpdateSupported';

export type EasUpdateOffer = {
  updateId: string;
};

export function useEasUpdate() {
  const [offer, setOffer] = useState<EasUpdateOffer | null>(null);
  const checkingRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (!isEasUpdateSupported() || checkingRef.current) {
      return;
    }
    checkingRef.current = true;
    try {
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        setOffer(null);
        return;
      }
      const fetch = await Updates.fetchUpdateAsync();
      if (!fetch.isNew) {
        setOffer(null);
        return;
      }
      const updateId = easUpdateIdentity(fetch.manifest);
      if (!updateId) {
        setOffer({ updateId: 'pending' });
        return;
      }
      const dismissed = await getDismissedEasUpdateId();
      if (dismissed === updateId) {
        setOffer(null);
        return;
      }
      setOffer({ updateId });
    } catch {
      /* network / OTA failures are silent */
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void checkForUpdate();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [checkForUpdate]);

  const dismiss = useCallback(async () => {
    if (offer) {
      await setDismissedEasUpdateId(offer.updateId);
    }
    setOffer(null);
  }, [offer]);

  const applyUpdate = useCallback(async () => {
    await Updates.reloadAsync();
  }, []);

  return { offer, dismiss, applyUpdate };
}
