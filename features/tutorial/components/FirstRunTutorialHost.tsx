import { useCallback, useEffect, useState } from 'react';

import { FirstRunTutorialOverlay } from '@/features/tutorial/components/FirstRunTutorialOverlay';
import { getFirstRunTutorialDone, setFirstRunTutorialDone } from '@/features/tutorial/firstRunTutorialStorage';
import { setLastRecordedAppVersion } from '@/features/release-highlights/releaseHighlightsStorage';
import { useTutorialGateStore } from '@/shared/stores/tutorialGateStore';
import { useAuthStore } from '@/shared/stores/authStore';
import Constants from 'expo-constants';

/**
 * One-time guided tour after sign-in (per user). Keeps other promo modals from stacking via `tutorialGateStore`.
 */
export function FirstRunTutorialHost() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!uid) {
      setShow(false);
      useTutorialGateStore.getState().setFirstRunTutorialOpen(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const done = await getFirstRunTutorialDone(uid);
      if (cancelled) {
        return;
      }
      if (done) {
        return;
      }
      useTutorialGateStore.getState().setFirstRunTutorialOpen(true);
      setShow(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const onComplete = useCallback(async () => {
    if (uid) {
      await setFirstRunTutorialDone(uid);
      const version = Constants.expoConfig?.version?.trim() || '0.0.0';
      await setLastRecordedAppVersion(uid, version);
    }
    useTutorialGateStore.getState().setFirstRunTutorialOpen(false);
    setShow(false);
  }, [uid]);

  return <FirstRunTutorialOverlay visible={show} onComplete={onComplete} />;
}
