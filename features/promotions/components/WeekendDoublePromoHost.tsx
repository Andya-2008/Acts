import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { WeekendDoubleOverlay } from '@/features/promotions/components/WeekendDoubleOverlay';
import {
  getLastWeekendDoublePromoKey,
  setLastWeekendDoublePromoKey,
} from '@/features/promotions/weekendDoublePromoStorage';
import { isWeekendDoubleActive, weekendDoublePromoStorageKey } from '@/shared/utils/weekendDouble';
import { useTutorialGateStore } from '@/shared/stores/tutorialGateStore';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * Shows the weekend double promo once per Fri–Sun window (first time the app becomes active that weekend).
 */
export function WeekendDoublePromoHost() {
  const uid = useAuthStore((s) => s.user?.uid);
  const tutorialBlocking = useTutorialGateStore((s) => s.firstRunTutorialOpen);
  const [show, setShow] = useState(false);
  const busyRef = useRef(false);

  const maybeShow = useCallback(async () => {
    if (!uid || busyRef.current || !isWeekendDoubleActive()) {
      return;
    }
    if (useTutorialGateStore.getState().firstRunTutorialOpen) {
      return;
    }
    const key = weekendDoublePromoStorageKey();
    if (!key) {
      return;
    }
    busyRef.current = true;
    try {
      const last = await getLastWeekendDoublePromoKey();
      if (last === key) {
        return;
      }
      setShow(true);
    } finally {
      busyRef.current = false;
    }
  }, [uid]);

  useEffect(() => {
    if (!tutorialBlocking) {
      void maybeShow();
    }
  }, [tutorialBlocking, maybeShow]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') {
        void maybeShow();
      }
    });
    return () => sub.remove();
  }, [maybeShow]);

  const onClose = useCallback(() => {
    setShow(false);
    const key = weekendDoublePromoStorageKey();
    if (key) {
      void setLastWeekendDoublePromoKey(key);
    }
  }, []);

  return <WeekendDoubleOverlay visible={show} onClose={onClose} />;
}
