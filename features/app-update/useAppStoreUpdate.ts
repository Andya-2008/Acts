import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { getDismissedAppStoreVersion, setDismissedAppStoreVersion } from '@/features/app-update/appUpdateDismissStorage';
import { fetchLatestAppStoreVersion } from '@/features/app-update/fetchAppStoreVersion';
import { isSemverNewer } from '@/shared/utils/compareSemver';

export type AppStoreUpdateOffer = {
  currentVersion: string;
  latestVersion: string;
  storeUrl: string;
};

function currentAppVersion(): string {
  return Constants.expoConfig?.version?.trim() || '0.0.0';
}

export function useAppStoreUpdate() {
  const [offer, setOffer] = useState<AppStoreUpdateOffer | null>(null);
  const checkingRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (Platform.OS !== 'ios' || checkingRef.current) {
      return;
    }
    checkingRef.current = true;
    try {
      const current = currentAppVersion();
      const latest = await fetchLatestAppStoreVersion();
      if (!latest || !isSemverNewer(latest.version, current)) {
        setOffer(null);
        return;
      }
      const dismissed = await getDismissedAppStoreVersion();
      if (dismissed === latest.version) {
        setOffer(null);
        return;
      }
      setOffer({
        currentVersion: current,
        latestVersion: latest.version,
        storeUrl: latest.storeUrl,
      });
    } catch {
      /* network / lookup failures are silent */
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
      await setDismissedAppStoreVersion(offer.latestVersion);
    }
    setOffer(null);
  }, [offer]);

  return { offer, dismiss };
}
