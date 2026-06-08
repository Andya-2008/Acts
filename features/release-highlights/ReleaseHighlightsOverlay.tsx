import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ReleaseHighlightPack } from '@/features/release-highlights/releaseHighlightsCatalog';
import { AppButton, AppText } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type ReleaseHighlightsOverlayProps = {
  visible: boolean;
  release: ReleaseHighlightPack;
  onComplete: () => void;
};

export function ReleaseHighlightsOverlay({ visible, release, onComplete }: ReleaseHighlightsOverlayProps) {
  const act = useActAppearance();
  const reduceMotion = useReduceMotion();
  const [step, setStep] = useState(0);

  const finish = useCallback(() => {
    setStep(0);
    onComplete();
  }, [onComplete]);

  const slide = useMemo(
    () => release.slides[Math.min(step, release.slides.length - 1)]!,
    [release.slides, step],
  );
  const isLast = step >= release.slides.length - 1;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      animationType={reduceMotion ? 'none' : 'fade'}
      presentationStyle="fullScreen"
      onRequestClose={finish}>
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right', 'bottom']} style={{ backgroundColor: act.palette.canvas }}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-2">
          <AppText variant="caption" className="font-semibold text-acts-green">
            {release.headline}
          </AppText>
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            accessibilityLabel="Skip what's new"
            hitSlop={12}
            className="rounded-lg px-2 py-1 active:opacity-70">
            <AppText variant="subtitle" className="text-acts-muted">
              Skip
            </AppText>
          </Pressable>
        </View>

        <View className="flex-1 justify-center px-6">
          <View className="mb-6 items-center">
            <View
              className="mb-5 h-24 w-24 items-center justify-center rounded-3xl border-2"
              style={{ borderColor: `${act.palette.green}55`, backgroundColor: act.palette.greenSoft }}>
              <Ionicons name={slide.icon} size={52} color={act.palette.green} />
            </View>
            <AppText variant="title" className="mb-3 text-center text-acts-ink">
              {slide.title}
            </AppText>
            <AppText variant="body" className="max-w-xl text-center leading-6 text-acts-muted">
              {slide.body}
            </AppText>
          </View>

          <View className="mb-6 flex-row justify-center gap-2">
            {release.slides.map((_, i) => (
              <View
                key={i}
                className="h-2 rounded-full"
                style={{
                  width: i === step ? 22 : 8,
                  backgroundColor: i === step ? act.palette.green : act.palette.border,
                }}
              />
            ))}
          </View>
        </View>

        <View className="flex-row items-center justify-between gap-3 border-t border-acts-border px-5 pb-4 pt-3">
          <AppButton
            title="Back"
            variant="ghost"
            className="min-w-[100px]"
            disabled={step === 0}
            onPress={() => setStep((s) => Math.max(0, s - 1))}
          />
          <AppButton
            title={isLast ? 'Continue' : 'Next'}
            variant="primary"
            className="min-w-[140px] flex-1"
            onPress={() => {
              if (isLast) {
                finish();
              } else {
                setStep((s) => s + 1);
              }
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
