import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export type TaskRewardCardRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TaskRewardFlyProps = {
  flyKey: number;
  card: TaskRewardCardRect;
  endX: number;
  endY: number;
  heartCount: number;
  onFinished: () => void;
};

const CARD_DISSOLVE_MS = 340;
const HEART_FLY_MS = 620;
const HEART_STAGGER_CAP_MS = 110;
const HEART_ICON = '♥';

/** Stable pseudo-random in [0, 1) from index + salt (deterministic per flight). */
function scatter01(index: number, salt: number, flyKey: number): number {
  const n = Math.sin(index * 12.9898 + salt * 78.233 + flyKey * 0.001) * 43758.5453123;
  return n - Math.floor(n);
}

type HeartConfig = {
  startX: number;
  startY: number;
  flightDelay: number;
  duration: number;
};

function buildHeartConfigs(card: TaskRewardCardRect, count: number, flyKey: number): HeartConfig[] {
  const pad = 10;
  const innerW = Math.max(8, card.width - pad * 2);
  const innerH = Math.max(8, card.height - pad * 2);
  const out: HeartConfig[] = [];
  for (let i = 0; i < count; i += 1) {
    const u = scatter01(i, 0, flyKey);
    const v = scatter01(i, 1, flyKey);
    const startX = card.x + pad + u * innerW;
    const startY = card.y + pad + v * innerH;
    const flightDelay = CARD_DISSOLVE_MS * 0.45 + Math.min(i * 5, HEART_STAGGER_CAP_MS);
    const duration = HEART_FLY_MS + (i % 6) * 22;
    out.push({ startX, startY, flightDelay, duration });
  }
  return out;
}

function heartFontSize(count: number): number {
  if (count > 36) {
    return 11;
  }
  if (count > 18) {
    return 13;
  }
  return 15;
}

/** Full-screen overlay: task card dissolves into many hearts that fly to the currency pill. */
export function TaskRewardFly({ flyKey, card, endX, endY, heartCount, onFinished }: TaskRewardFlyProps) {
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardRotate = useRef(new Animated.Value(0)).current;

  const configs = useMemo(
    () => buildHeartConfigs(card, heartCount, flyKey),
    [card, heartCount, flyKey],
  );

  const heartProgress = useMemo(
    () => Array.from({ length: heartCount }, () => new Animated.Value(0)),
    [flyKey, heartCount],
  );

  useEffect(() => {
    let cancelled = false;
    cardOpacity.setValue(1);
    cardScale.setValue(1);
    cardRotate.setValue(0);
    heartProgress.forEach((v) => v.setValue(0));

    const cardAnim = Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: CARD_DISSOLVE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.82,
        duration: CARD_DISSOLVE_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardRotate, {
        toValue: 1,
        duration: CARD_DISSOLVE_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    const heartAnims = configs.map((c, i) =>
      Animated.sequence([
        Animated.delay(Math.round(c.flightDelay)),
        Animated.timing(heartProgress[i]!, {
          toValue: 1,
          duration: c.duration,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    const master = Animated.parallel([cardAnim, Animated.parallel(heartAnims)]);
    master.start(({ finished }) => {
      if (!cancelled && finished) {
        onFinished();
      }
    });

    return () => {
      cancelled = true;
      master.stop();
    };
  }, [
    flyKey,
    configs,
    heartProgress,
    cardOpacity,
    cardScale,
    cardRotate,
    onFinished,
  ]);

  const fs = heartFontSize(heartCount);
  const spin = cardRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-5deg'],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} collapsable={false}>
      <Animated.View
        style={{
          position: 'absolute',
          left: card.x,
          top: card.y,
          width: card.width,
          height: card.height,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(34, 197, 94, 0.4)',
          backgroundColor: 'rgba(236, 253, 245, 0.96)',
          opacity: cardOpacity,
          transform: [{ scale: cardScale }, { rotate: spin }],
        }}
      />

      {configs.map((c, i) => (
        <FlyingHeart
          key={`${flyKey}-${i}`}
          progress={heartProgress[i]!}
          startX={c.startX}
          startY={c.startY}
          endX={endX}
          endY={endY}
          fontSize={fs}
        />
      ))}
    </View>
  );
}

type FlyingHeartProps = {
  progress: Animated.Value;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  fontSize: number;
};

function FlyingHeart({ progress, startX, startY, endX, endY, fontSize }: FlyingHeartProps) {
  const half = fontSize * 0.52;
  const tx = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startX - half, endX - half],
  });
  const ty = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startY - half, endY - half],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0.12, 1.08, 0.12],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 0.88, 1],
    outputRange: [0, 1, 0.92, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: [{ translateX: tx }, { translateY: ty }, { scale }],
        opacity,
      }}>
      <Text style={{ fontSize, color: '#E11D74', fontWeight: '700' }}>{HEART_ICON}</Text>
    </Animated.View>
  );
}
