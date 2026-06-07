import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, AppText } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

type IonName = NonNullable<ComponentProps<typeof Ionicons>['name']>;

type Slide = {
  icon: IonName;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: 'heart',
    title: 'Welcome to Acts',
    body: 'Build a habit of kindness with quick acts you can do every day. Use the three tabs at the bottom-Tasks, Deed Feed, and Profile-to move around the app.',
  },
  {
    icon: 'leaf-outline',
    title: 'Your task list',
    body: 'We highlighted an easy first act on Tasks. Check it off to earn seeds and lifetime XP in about a minute, then keep your streak going.',
  },
  {
    icon: 'people-outline',
    title: 'Add friends first',
    body: 'Your deed feed shows posts from friends on Acts. Invite people with a link, add them by username, or pick matches from your contacts.',
  },
  {
    icon: 'images-outline',
    title: 'Deed Feed',
    body: 'Share completed acts with a photo so friends can cheer you on. React to their posts and leave encouraging comments.',
  },
  {
    icon: 'person-circle-outline',
    title: 'Profile & settings',
    body: 'See your service rank, streak, and totals. Open Settings for notifications and appearance, Achievements for badges, and tap Shop on the Tasks header to open the Kindness Arcade.',
  },
  {
    icon: 'storefront-outline',
    title: 'Seeds & Kindness Arcade',
    body: 'Seeds are the hearts you earn from acts. Tap Shop on the Tasks header to spend them on themes, feed extras, and more.',
  },
];

type FirstRunTutorialOverlayProps = {
  visible: boolean;
  onComplete: () => void;
};

export function FirstRunTutorialOverlay({ visible, onComplete }: FirstRunTutorialOverlayProps) {
  const act = useActAppearance();
  const reduceMotion = useReduceMotion();
  const [step, setStep] = useState(0);

  const finish = useCallback(() => {
    setStep(0);
    onComplete();
  }, [onComplete]);

  const slide = useMemo(() => SLIDES[Math.min(step, SLIDES.length - 1)]!, [step]);
  const isLast = step >= SLIDES.length - 1;

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
        <View className="flex-row items-center justify-end px-4 pb-2 pt-2">
          <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Skip tutorial" hitSlop={12} className="rounded-lg px-2 py-1 active:opacity-70">
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
            {SLIDES.map((_, i) => (
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
          <AppButton title="Back" variant="ghost" className="min-w-[100px]" disabled={step === 0} onPress={() => setStep((s) => Math.max(0, s - 1))} />
          <AppButton
            title={isLast ? 'Get started' : 'Next'}
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
