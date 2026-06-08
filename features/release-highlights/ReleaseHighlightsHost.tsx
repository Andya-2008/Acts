import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';

import { getReleaseHighlightsForVersion } from '@/features/release-highlights/releaseHighlightsCatalog';
import { ReleaseHighlightsOverlay } from '@/features/release-highlights/ReleaseHighlightsOverlay';
import {
  getLastRecordedAppVersion,
  getReleaseHighlightsSeenVersion,
  setLastRecordedAppVersion,
  setReleaseHighlightsSeenVersion,
} from '@/features/release-highlights/releaseHighlightsStorage';
import { getFirstRunTutorialDone } from '@/features/tutorial/firstRunTutorialStorage';
import { useTutorialGateStore } from '@/shared/stores/tutorialGateStore';
import { useAuthStore } from '@/shared/stores/authStore';
import { isSemverNewer } from '@/shared/utils/compareSemver';

function currentAppVersion(): string {
  return Constants.expoConfig?.version?.trim() || '0.0.0';
}

/**
 * Full-screen what's-new walkthrough after an app update. Only runs for versions listed in
 * `releaseHighlightsCatalog` and only when the user upgraded (not on brand-new accounts).
 */
export function ReleaseHighlightsHost() {
  const uid = useAuthStore((s) => s.user?.uid);
  const firstRunTutorialOpen = useTutorialGateStore((s) => s.firstRunTutorialOpen);
  const [release, setRelease] = useState<ReturnType<typeof getReleaseHighlightsForVersion>>(null);
  const [show, setShow] = useState(false);

  const evaluate = useCallback(async () => {
    if (!uid || firstRunTutorialOpen) {
      return;
    }
    const tutorialDone = await getFirstRunTutorialDone(uid);
    if (!tutorialDone) {
      return;
    }

    const current = currentAppVersion();
    const pack = getReleaseHighlightsForVersion(current);
    if (!pack) {
      await setLastRecordedAppVersion(uid, current);
      return;
    }

    const seen = await getReleaseHighlightsSeenVersion(uid);
    if (seen === current) {
      await setLastRecordedAppVersion(uid, current);
      return;
    }

    const lastRecorded = await getLastRecordedAppVersion(uid);
    const upgraded =
      Boolean(lastRecorded && isSemverNewer(current, lastRecorded)) ||
      (lastRecorded === null && seen !== current);

    await setLastRecordedAppVersion(uid, current);

    if (!upgraded) {
      return;
    }
    if (useTutorialGateStore.getState().firstRunTutorialOpen) {
      return;
    }

    useTutorialGateStore.getState().setReleaseHighlightsOpen(true);
    setRelease(pack);
    setShow(true);
  }, [uid, firstRunTutorialOpen]);

  useEffect(() => {
    if (!uid) {
      setShow(false);
      setRelease(null);
      useTutorialGateStore.getState().setReleaseHighlightsOpen(false);
      return;
    }
    void evaluate();
  }, [uid, evaluate]);

  const onComplete = useCallback(async () => {
    if (uid && release) {
      await setReleaseHighlightsSeenVersion(uid, release.version);
    }
    useTutorialGateStore.getState().setReleaseHighlightsOpen(false);
    setShow(false);
    setRelease(null);
  }, [uid, release]);

  if (!release) {
    return null;
  }

  return <ReleaseHighlightsOverlay visible={show} release={release} onComplete={() => void onComplete()} />;
}
