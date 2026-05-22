import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ServiceRankTier } from '@/features/user-profile/config/xpServiceRanks';
import { AppText } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { overlayMotionDuration } from '@/shared/utils/accessibilityMotion';

export type ServiceRankUpPayload = {
  fromTier: ServiceRankTier;
  toTier: ServiceRankTier;
};

type ServiceRankUpOverlayProps = {
  payload: ServiceRankUpPayload | null;
  onClose: () => void;
};

const SPARKLE_COUNT = 14;

function hexToRgbComponents(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) {
    return null;
  }
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) {
    return null;
  }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function withAlpha(hex: string, a: number): string {
  const c = hexToRgbComponents(hex);
  if (!c) {
    return `rgba(0,0,0,${a})`;
  }
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

function sparkleStyle(index: number, radius: number, centerX: number, centerY: number) {
  const angle = (index / SPARKLE_COUNT) * Math.PI * 2 - Math.PI / 2;
  return {
    position: 'absolute' as const,
    left: centerX + Math.cos(angle) * radius - 5,
    top: centerY + Math.sin(angle) * radius - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
  };
}

function RankSlideColumn({
  tier,
  eyebrow,
  showRankUpLine,
  accent,
  canvas,
  ink,
  columnWidth,
  titleMaxWidth,
}: {
  tier: ServiceRankTier;
  eyebrow: string;
  showRankUpLine: boolean;
  accent: string;
  canvas: string;
  ink: string;
  columnWidth: number;
  titleMaxWidth: number;
}) {
  const act = useActAppearance();
  const deckBg = withAlpha(ink, 0.52);
  const deckBorder = 'rgba(255,255,255,0.22)';
  const deckMax = Math.min(columnWidth - 24, 300);

  return (
    <View style={{ width: columnWidth, alignItems: 'center', paddingHorizontal: 16 }}>
      <View
        style={[
          styles.iconBubble,
          {
            backgroundColor: canvas,
            borderColor: accent,
            shadowColor: accent,
          },
        ]}>
        <Ionicons name={tier.icon} size={54} color={accent} />
      </View>

      <View style={{ marginTop: 22, width: '100%', maxWidth: deckMax, alignItems: 'stretch' }}>
        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: deckBorder,
            backgroundColor: deckBg,
            paddingHorizontal: 14,
            paddingVertical: 16,
          }}>
          <AppText
            variant="caption"
            paletteColor={false}
            className="text-center font-bold uppercase tracking-[0.16em]"
            style={{ color: 'rgba(255,247,251,0.82)' }}>
            {eyebrow}
          </AppText>
          {showRankUpLine ? (
            <AppText
              variant="caption"
              paletteColor={false}
              className="mt-1.5 text-center font-bold uppercase tracking-[0.2em]"
              style={{ color: 'rgba(255,247,251,0.92)' }}>
              Rank up
            </AppText>
          ) : null}
          <Text
            allowFontScaling
            maxFontSizeMultiplier={act.maxFontSizeMultiplier}
            numberOfLines={3}
            style={[
              styles.rankTitle,
              {
                marginTop: showRankUpLine ? 10 : 12,
                alignSelf: 'center',
                maxWidth: titleMaxWidth,
                color: canvas,
              },
            ]}>
            {tier.label}
          </Text>
          <AppText
            variant="body"
            paletteColor={false}
            numberOfLines={3}
            className="mt-3 text-center leading-6"
            style={{ color: 'rgba(255,247,251,0.88)', maxWidth: titleMaxWidth + 8, alignSelf: 'center' }}>
            {tier.tagline}
          </AppText>
        </View>
      </View>
    </View>
  );
}

/** Full-screen celebration: previous rank, then horizontal slide to the new rank. */
export function ServiceRankUpOverlay({ payload, onClose }: ServiceRankUpOverlayProps) {
  const act = useActAppearance();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = Dimensions.get('window');
  const center = useMemo(() => ({ x: winW / 2, y: winH * 0.38 }), [winW, winH]);
  const ringR = Math.min(winW, winH) * 0.22;

  const backdrop = useRef(new Animated.Value(0)).current;
  const stripSlide = useRef(new Animated.Value(0)).current;
  const stripReveal = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const sparkles = useRef(Array.from({ length: SPARKLE_COUNT }, () => new Animated.Value(0))).current;
  const ringLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const runTokenRef = useRef(0);

  const runEnter = () => {
    const token = (runTokenRef.current += 1);
    ringLoopRef.current?.stop();
    backdrop.setValue(0);
    stripSlide.setValue(0);
    stripReveal.setValue(0);
    ringSpin.setValue(0);
    sparkles.forEach((s) => s.setValue(0));

    if (reduceMotion) {
      backdrop.setValue(1);
      stripReveal.setValue(1);
      stripSlide.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    ringLoopRef.current = loop;

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(stripReveal, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.delay(950),
        Animated.timing(stripSlide, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (runTokenRef.current === token) {
        loop.start();
      }
    });

    const stagger = Animated.stagger(
      40,
      sparkles.map((s) =>
        Animated.sequence([
          Animated.timing(s, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(s, { toValue: 0.35, duration: 380, useNativeDriver: true }),
        ]),
      ),
    );
    Animated.sequence([Animated.delay(100), stagger]).start();
  };

  useEffect(() => {
    if (!payload) {
      return;
    }
    runEnter();
  }, [payload?.fromTier.id, payload?.toTier.id, reduceMotion]);

  useEffect(() => {
    return () => {
      ringLoopRef.current?.stop();
    };
  }, []);

  const dismiss = () => {
    ringLoopRef.current?.stop();
    const dur = overlayMotionDuration(reduceMotion, 260);
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: dur, useNativeDriver: true }),
      Animated.timing(stripReveal, { toValue: 0, duration: dur - 40, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  };

  const ringRotate = ringSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const stripTranslateX = stripSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -winW],
  });

  if (!payload) {
    return null;
  }

  const { fromTier, toTier } = payload;
  const ink = act.palette.ink;
  const accent = act.palette.green;
  const canvas = act.palette.canvas;
  const titleMaxWidth = Math.min(winW - 72, 260);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
      onRequestClose={dismiss}>
      <Pressable style={styles.fill} onPress={dismiss}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              backgroundColor: ink,
              opacity: backdrop.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.88],
              }),
            },
          ]}
        />

        {!reduceMotion
          ? sparkles.map((sv, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={[
                  sparkleStyle(i, ringR + 36, center.x, center.y),
                  {
                    backgroundColor: accent,
                    opacity: sv,
                    transform: [{ scale: sv.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
                  },
                ]}
              />
            ))
          : null}

        {!reduceMotion ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: ringR * 2 + 48,
                height: ringR * 2 + 48,
                borderRadius: ringR + 24,
                borderColor: `${accent}55`,
                left: center.x - ringR - 24,
                top: center.y - ringR - 24,
                transform: [{ rotate: ringRotate }],
              },
            ]}
          />
        ) : null}

        <Animated.View
          style={[
            styles.rankStripWrap,
            {
              paddingTop: center.y - ringR - 8,
              opacity: stripReveal,
              transform: [
                {
                  translateY: stripReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="box-none">
          <View style={{ width: winW, overflow: 'hidden', alignSelf: 'center' }}>
            <Animated.View
              style={{
                flexDirection: 'row',
                width: winW * 2,
                transform: [{ translateX: stripTranslateX }],
              }}>
              <RankSlideColumn
                tier={fromTier}
                eyebrow="Your rank"
                showRankUpLine={false}
                accent={accent}
                canvas={canvas}
                ink={ink}
                columnWidth={winW}
                titleMaxWidth={titleMaxWidth}
              />
              <RankSlideColumn
                tier={toTier}
                eyebrow="Unlocked"
                showRankUpLine
                accent={accent}
                canvas={canvas}
                ink={ink}
                columnWidth={winW}
                titleMaxWidth={titleMaxWidth}
              />
            </Animated.View>
          </View>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 16) }]} pointerEvents="box-none">
          <AppText variant="caption" paletteColor={false} className="text-center" style={{ color: `${canvas}99` }}>
            Tap anywhere to continue
          </AppText>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  rankStripWrap: {
    flex: 1,
    alignItems: 'center',
  },
  iconBubble: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  rankTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'solid',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
