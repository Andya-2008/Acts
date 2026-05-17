import { Modal, Pressable, Switch, View } from 'react-native';

import type { DeedCardTintId } from '@/shared/constants/deedPostCardTints';
import { DEED_CARD_TINT_HEX, DEED_CARD_TINT_OPTIONS } from '@/shared/constants/deedPostCardTints';
import { AppButton, AppText } from '@/shared/components/ui';

type DeedPostCardSettingsModalProps = {
  visible: boolean;
  selectedTintId: DeedCardTintId | null;
  reactionsOn: boolean;
  commentsOn: boolean;
  saving: boolean;
  onClose: () => void;
  onPickTint: (tintId: DeedCardTintId | null) => void;
  onChangeReactions: (on: boolean) => void;
  onChangeComments: (on: boolean) => void;
};

export function DeedPostCardSettingsModal({
  visible,
  selectedTintId,
  reactionsOn,
  commentsOn,
  saving,
  onClose,
  onPickTint,
  onChangeReactions,
  onChangeComments,
}: DeedPostCardSettingsModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-3xl bg-acts-surface px-5 pb-8 pt-5" onPress={(e) => e.stopPropagation()}>
          <AppText variant="subtitle" className="mb-3 text-acts-ink">
            Card options
          </AppText>

          <AppText variant="label" className="mb-2 text-acts-muted">
            Background
          </AppText>
          <View className="mb-5 flex-row flex-wrap gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Default card background"
              accessibilityState={{ selected: selectedTintId == null }}
              disabled={saving}
              onPress={() => onPickTint(null)}
              className={`h-14 w-[30%] max-w-[120px] items-center justify-center rounded-2xl border-2 ${
                selectedTintId == null ? 'border-acts-green bg-acts-green-soft' : 'border-acts-border bg-acts-canvas'
              }`}>
              <AppText variant="label" className="text-acts-ink">
                Default
              </AppText>
            </Pressable>
            {DEED_CARD_TINT_OPTIONS.map(({ id, label }) => {
              const selected = selectedTintId === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={`${label} background`}
                  accessibilityState={{ selected }}
                  disabled={saving}
                  onPress={() => onPickTint(id)}
                  className={`h-14 w-[30%] max-w-[120px] items-center justify-center rounded-2xl border-2 ${
                    selected ? 'border-acts-green' : 'border-acts-border/80'
                  }`}
                  style={{ backgroundColor: DEED_CARD_TINT_HEX[id] }}>
                  <AppText variant="label" className="text-acts-ink">
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View className="mb-4 flex-row items-center justify-between border-t border-acts-border/50 py-3">
            <AppText variant="subtitle" className="text-acts-ink">
              Reactions
            </AppText>
            <Switch
              accessibilityLabel="Allow reactions on this deed"
              value={reactionsOn}
              disabled={saving}
              onValueChange={onChangeReactions}
            />
          </View>

          <View className="mb-5 flex-row items-center justify-between border-t border-acts-border/50 py-3">
            <AppText variant="subtitle" className="text-acts-ink">
              Comments
            </AppText>
            <Switch
              accessibilityLabel="Allow comments on this deed"
              value={commentsOn}
              disabled={saving}
              onValueChange={onChangeComments}
            />
          </View>

          <AppButton
            title={saving ? 'Saving…' : 'Close'}
            variant="secondary"
            className="w-full"
            disabled={saving}
            onPress={onClose}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
