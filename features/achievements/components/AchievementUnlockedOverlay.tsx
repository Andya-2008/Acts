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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AchievementDef } from '@/features/achievements/achievementCatalog';
import { AppButton, AppText } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { overlayMotionDuration } from '@/shared/utils/accessibilityMotion';
import { router, type Href } from 'expo-router';

const SPARKLE_COUNT = 12;

type AchievementUnlockedOverlayProps = {
  achievement: AchievementDef | null;
  onClose: () => void;
};

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

/** Full-screen unlock moment (tap anywhere to dismiss). */
export function AchievementUnlockedOverlay({ achievement, onClose }: AchievementUnlockedOverlayProps) {
  const act = useActAppearance();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = Dimensions.get('window');
  const center = useMemo(() => ({ x: winW / 2, y: winH * 0.36 }), [winW, winH]);
  const ringR = Math.min(winW, winH) * 0.2;

  const backdrop = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const sparkles = useRef(Array.from({ length: SPARKLE_COUNT }, () => new Animated.Value(0))).current;
  const runTokenRef = useRef(0);

  const runEnter = () => {
    const token = (runTokenRef.current += 1);
    backdrop.setValue(0);
    reveal.setValue(0);
    iconScale.setValue(0);
    sparkles.forEach((s) => s.setValue(0));

    if (reduceMotion) {
      backdrop.setValue(1);
      reveal.setValue(1);
      iconScale.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(reveal, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(iconScale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 0.96, duration: 120, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 1, friction: 8, tension: 140, useNativeDriver: true }),
      ]),
    ]).start();

    const stagger = Animated.stagger(
      36,
      sparkles.map((s) =>
        Animated.sequence([
          Animated.timing(s, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(s, { toValue: 0.4, duration: 320, useNativeDriver: true }),
        ]),
      ),
    );
    Animated.sequence([Animated.delay(80), stagger]).start(() => {
      void token;
    });
  };

  useEffect(() => {
    if (!achievement) {
      return;
    }
    runEnter();
  }, [achievement?.id, reduceMotion]);

  const dismiss = () => {
    const dur = overlayMotionDuration(reduceMotion, 240);
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: dur, useNativeDriver: true }),
      Animated.timing(reveal, { toValue: 0, duration: dur - 40, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  };

  if (!achievement) {
    return null;
  }

  const ink = act.palette.ink;
  const accent = achievement.accentHex;
  const eyebrow =
    achievement.category === 'streak'
      ? 'Streak achievement'
      : achievement.category === 'xp'
        ? 'XP milestone'
        : achievement.category === 'acts'
          ? 'Acts milestone'
          : 'Achievement unlocked';
  const heroStat =
    achievement.metric.kind === 'streak_min'
      ? achievement.metric.days
      : achievement.metric.kind === 'acts_min'
        ? achievement.metric.n
        : achievement.metric.kind === 'xp_min'
          ? achievement.metric.xp
          : achievement.metric.kind === 'deed_posts_min'
            ? achievement.metric.n
            : null;
  const heroLabel =
    achievement.metric.kind === 'streak_min'
      ? 'day streak'
      : achievement.metric.kind === 'acts_min'
        ? 'acts'
        : achievement.metric.kind === 'xp_min'
          ? 'lifetime XP'
          : achievement.metric.kind === 'deed_posts_min'
            ? 'deed posts'
            : null;

  const openAchievements = () => {
    onClose();
    router.push('/(app)/achievements' as Href);
  };

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
                outputRange: [0, 0.9],
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
                  sparkleStyle(i, ringR + 28, center.x, center.y),
                  {
                    backgroundColor: accent,
                    opacity: sv,
                    transform: [{ scale: sv.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }],
                  },
                ]}
              />
            ))
          : null}

        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.centerCol,
            {
              paddingTop: center.y - 72,
              opacity: reveal,
              transform: [
                {
                  translateY: reveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, 0],
                  }),
                },
              ],
            },
          ]}>
          <View
            style={[
              styles.iconBubble,
              {
                borderColor: accent,
                shadowColor: accent,
                backgroundColor: act.palette.surface,
              },
            ]}>
            <Animated.View style={{ transform: [{ scale: iconScale }] }}>
              <Ionicons name={achievement.icon} size={64} color={accent} />
            </Animated.View>
          </View>

          <AppText
            variant="caption"
            paletteColor={false}
            className="mt-6 text-center font-bold uppercase tracking-[0.2em]"
            style={{ color: 'rgba(255,247,251,0.85)' }}>
            {eyebrow}
          </AppText>
          {heroStat != null && heroLabel ? (
            <View className="mt-4 items-center">
              <AppText
                variant="title"
                paletteColor={false}
                className="text-center text-white"
                style={{ fontSize: 48, lineHeight: 52 }}>
                {heroStat.toLocaleString()}
              </AppText>
              <AppText variant="caption" paletteColor={false} className="mt-1 text-center" style={{ color: 'rgba(255,247,251,0.8)' }}>
                {heroLabel}
              </AppText>
            </View>
          ) : null}
          <AppText variant="title" paletteColor={false} className="mt-3 px-8 text-center text-white" numberOfLines={2}>
            {achievement.title}
          </AppText>
          <AppText
            variant="body"
            paletteColor={false}
            className="mt-3 max-w-[320px] self-center px-6 text-center leading-6"
            style={{ color: 'rgba(255,247,251,0.88)' }}>
            {achievement.description}
          </AppText>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 12) }]} pointerEvents="box-none">
          <AppButton
            title="View trophy case"
            className="mb-3 w-full max-w-[320px] self-center"
            onPress={openAchievements}
          />
          <AppText variant="caption" paletteColor={false} className="text-center" style={{ color: `${act.palette.canvas}99` }}>
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
  centerCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconBubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 14,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
