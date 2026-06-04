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

import { AppText } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { overlayMotionDuration } from '@/shared/utils/accessibilityMotion';

type WeekendDoubleOverlayProps = {
  visible: boolean;
  onClose: () => void;
};

const SPARKLE_COUNT = 14;

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

/** First-open-of-weekend promo: double seeds & lifetime XP through Sunday night. */
export function WeekendDoubleOverlay({ visible, onClose }: WeekendDoubleOverlayProps) {
  const act = useActAppearance();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = Dimensions.get('window');
  const center = useMemo(() => ({ x: winW / 2, y: winH * 0.34 }), [winW, winH]);
  const ringR = Math.min(winW, winH) * 0.2;

  const backdrop = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(0)).current;
  const sparkles = useRef(Array.from({ length: SPARKLE_COUNT }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) {
      return;
    }
    backdrop.setValue(0);
    reveal.setValue(0);
    iconPulse.setValue(0);
    sparkles.forEach((s) => s.setValue(0));

    if (reduceMotion) {
      backdrop.setValue(1);
      reveal.setValue(1);
      iconPulse.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(reveal, { toValue: 1, friction: 7, tension: 78, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(iconPulse, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
        Animated.timing(iconPulse, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
    ]).start();

    const stagger = Animated.stagger(
      32,
      sparkles.map((s) =>
        Animated.sequence([
          Animated.timing(s, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.timing(s, { toValue: 0.35, duration: 340, useNativeDriver: true }),
        ]),
      ),
    );
    Animated.sequence([Animated.delay(80), stagger]).start();
  }, [visible, reduceMotion]);

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

  if (!visible) {
    return null;
  }

  const ink = act.palette.ink;
  const accent = act.palette.green;
  const canvas = act.palette.canvas;

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
                  sparkleStyle(i, ringR + 32, center.x, center.y),
                  {
                    backgroundColor: accent,
                    opacity: sv,
                    transform: [{ scale: sv.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1.05] }) }],
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
              paddingTop: center.y - 80,
              opacity: reveal,
              transform: [
                {
                  translateY: reveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}>
          <Animated.View
            style={{
              transform: [
                {
                  scale: iconPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
              ],
            }}>
            <View
              style={[
                styles.iconBubble,
                {
                  borderColor: accent,
                  shadowColor: accent,
                  backgroundColor: act.palette.surface,
                },
              ]}>
              <Ionicons name="sparkles" size={56} color={accent} />
            </View>
          </Animated.View>

          <AppText
            variant="caption"
            paletteColor={false}
            className="mt-7 text-center font-bold uppercase tracking-[0.22em]"
            style={{ color: 'rgba(255,247,251,0.86)' }}>
            Weekend bonus
          </AppText>
          <AppText variant="title" paletteColor={false} className="mt-3 px-6 text-center text-white" numberOfLines={2}>
            Double seeds & XP
          </AppText>
          <AppText
            variant="body"
            paletteColor={false}
            className="mt-4 max-w-[320px] self-center px-5 text-center leading-6"
            style={{ color: 'rgba(255,247,251,0.9)' }}>
            All weekend long (Friday-Sunday), every seed reward and lifetime XP you earn from Acts is doubled.
          </AppText>
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 12) }]} pointerEvents="box-none">
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
  centerCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconBubble: {
    width: 118,
    height: 118,
    borderRadius: 59,
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
