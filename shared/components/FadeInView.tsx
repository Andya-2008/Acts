import type { ReactNode } from 'react';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

type FadeInViewProps = {
  children: ReactNode;
  /** When true (default), content fades in with a short upward motion. */
  withMotion?: boolean;
  delayMs?: number;
  durationMs?: number;
};

/**
 * One-shot entrance animation for screen sections (mount only).
 * Avoid wrapping high-churn FlatList rows — cells recycle and can replay the animation.
 */
export function FadeInView({
  children,
  withMotion = true,
  delayMs = 0,
  durationMs = 400,
}: FadeInViewProps) {
  const entering = withMotion
    ? FadeInDown.duration(durationMs).delay(delayMs)
    : FadeIn.duration(durationMs).delay(delayMs);
  return <Animated.View entering={entering}>{children}</Animated.View>;
}
