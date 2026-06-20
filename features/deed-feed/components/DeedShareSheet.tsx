import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  deedShareCaptionTemplates,
  defaultDeedShareCaption,
} from '@/features/deed-feed/utils/deedShareCaptions';
import { deedShareRewardSummary } from '@/features/deed-feed/utils/deedShareRewardLabel';
import { ActsTextInput, AppButton, AppText } from '@/shared/components/ui';
import { getActsTextInputBoxStyle } from '@/shared/components/ui/actsTextInputMetrics';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';
import type { ActTask } from '@/shared/types/task';

type DeedShareSheetProps = {
  visible: boolean;
  task: ActTask | null;
  seedsReward: number;
  xpReward: number;
  sharing?: boolean;
  onShare: (caption: string) => void;
  onClose: () => void;
};

export function DeedShareSheet({
  visible,
  task,
  seedsReward,
  xpReward,
  sharing = false,
  onShare,
  onClose,
}: DeedShareSheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (visible && task) {
      setCaption(defaultDeedShareCaption(task));
    }
  }, [visible, task?.id]);

  if (!task) {
    return null;
  }

  const templates = deedShareCaptionTemplates(task);
  const photoUri = task.photoUrl?.trim();
  const rewardLabel = deedShareRewardSummary(seedsReward, xpReward);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={modalAnimationType(reduceMotion, 'fade')}
      onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/55" accessibilityLabel="Dismiss share sheet" onPress={onClose}>
        <Pressable
          className="max-h-[88%] rounded-t-3xl border-t-2 border-acts-border bg-acts-surface px-5 pt-5"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-acts-border" />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <AppText variant="caption" className="mb-1 text-acts-blue">
              Share to deed feed
            </AppText>
            <AppText variant="title" className="mb-2 text-acts-ink">
              Inspire your friends
            </AppText>
            <AppText variant="body" className="mb-3 leading-6 text-acts-muted">
              Optional — share what you did with a quick caption. You earn a bonus when you post.
            </AppText>

            <View
              className="mb-4 flex-row items-center self-start rounded-full px-3 py-1.5"
              style={{ backgroundColor: '#ECFDF5' }}>
              <AppText variant="caption" className="font-semibold text-acts-green">
                {rewardLabel}
              </AppText>
            </View>

            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, marginBottom: 16 }}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            ) : null}

            <AppText variant="caption" className="mb-2 font-semibold text-acts-muted">
              Caption
            </AppText>
            <ActsTextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="What did you do?"
              placeholderTextColor="#9CA3AF"
              multiline
              className="mb-3 min-h-[88px] rounded-2xl border border-acts-border bg-acts-canvas text-acts-ink"
              style={getActsTextInputBoxStyle()}
              editable={!sharing}
            />

            <AppText variant="caption" className="mb-2 font-semibold text-acts-muted">
              Quick captions
            </AppText>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {templates.map((template) => {
                const selected = caption.trim() === template;
                return (
                  <Pressable
                    key={template}
                    accessibilityRole="button"
                    accessibilityLabel={`Use caption: ${template}`}
                    disabled={sharing}
                    onPress={() => setCaption(template)}
                    className={`rounded-2xl border px-3 py-2 ${
                      selected
                        ? 'border-acts-blue bg-acts-blue-soft'
                        : 'border-acts-border bg-acts-surface'
                    } ${sharing ? 'opacity-50' : ''}`}>
                    <AppText variant="caption" className="text-acts-ink">
                      {template}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <AppButton
            title={`Share to feed (${rewardLabel})`}
            className="mb-2 w-full"
            loading={sharing}
            disabled={sharing || !photoUri}
            onPress={() => onShare(caption)}
          />
          <AppButton title="Not now" variant="secondary" className="w-full" disabled={sharing} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
