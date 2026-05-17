import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

import { AppText } from '@/shared/components/ui';
import { useCurrencyStore } from '@/shared/stores/currencyStore';

type CurrencyPillProps = {
  /** When true, omit trailing margin (e.g. header row with a sibling control). */
  trailing?: boolean;
};

/** Compact balance shown in navigation (top right). */
export function CurrencyPill({ trailing = false }: CurrencyPillProps) {
  const balance = useCurrencyStore((s) => s.balance);
  const setPillAnchor = useCurrencyStore((s) => s.setPillAnchor);
  const measureRef = useRef<View>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const [display, setDisplay] = useState(balance);
  const lastSettled = useRef(balance);
  const displayRef = useRef(balance);
  const rafRef = useRef<number | null>(null);

  displayRef.current = display;

  const reportAnchor = () => {
    measureRef.current?.measureInWindow((x, y, w, h) => {
      const heartCx = x + 22;
      const heartCy = y + h / 2;
      setPillAnchor({ x: heartCx, y: heartCy });
    });
  };

  useLayoutEffect(() => {
    requestAnimationFrame(reportAnchor);
  }, [balance, setPillAnchor]);

  useEffect(() => {
    return () => {
      setPillAnchor(null);
    };
  }, [setPillAnchor]);

  useEffect(() => {
    if (balance < lastSettled.current) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setDisplay(balance);
      lastSettled.current = balance;
      return;
    }

    const from = displayRef.current;
    const to = balance;
    if (to === from) {
      lastSettled.current = to;
      return;
    }

    const duration = 380;
    const started = performance.now();

    const runBounce = () => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 220, useNativeDriver: true }),
      ]).start();
    };

    const tick = () => {
      const now = performance.now();
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setDisplay(to);
        lastSettled.current = to;
        runBounce();
      }
    };

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [balance, scale]);

  return (
    <View
      ref={measureRef}
      collapsable={false}
      className={trailing ? '' : 'mr-4'}
      onLayout={() => requestAnimationFrame(reportAnchor)}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          accessibilityRole="text"
          accessibilityLabel={`Balance ${display}`}
          className="flex-row items-center rounded-full border border-acts-border/60 bg-acts-surface px-3 py-1.5">
          <Ionicons name="heart" size={17} color="#E11D74" />
          <AppText variant="subtitle" className="ml-1.5 min-w-[1.25rem] text-right text-acts-ink">
            {display}
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}
