import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import type { TaskListFiltersState } from '@/features/tasks/utils/taskListFilters';
import { DEFAULT_TASK_LIST_FILTERS } from '@/features/tasks/utils/taskListFilters';
import { AppButton, AppText } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { filterChipStyle, modalAnimationType } from '@/shared/utils/accessibilityMotion';
import type { TaskCadence, TaskDifficultyLevel } from '@/shared/types/task';

const CADENCES: { id: TaskCadence; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'anytime', label: 'Anytime' },
];

const DIFFICULTIES: { id: TaskDifficultyLevel; label: string }[] = [
  { id: 1, label: 'Easy' },
  { id: 2, label: 'Medium' },
  { id: 3, label: 'Hard' },
];

function toggleInList<T extends string | number>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: TaskListFiltersState;
  onChange: (next: TaskListFiltersState) => void;
  /** Distinct categories from the user's current task list. */
  categoryOptions: string[];
};

export function TaskListFiltersModal({ visible, onClose, filters, onChange, categoryOptions }: Props) {
  const act = useActAppearance();
  const reduceMotion = useReduceMotion();
  const sortedCategories = useMemo(() => [...categoryOptions].sort((a, b) => a.localeCompare(b)), [categoryOptions]);

  const filterChip = (label: string, selected: boolean, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} filter${selected ? ', on' : ', off'}`}
      onPress={onPress}
      className="rounded-full border px-3 py-2"
      style={filterChipStyle(act.palette, selected)}>
      <AppText variant="caption" className={selected ? 'font-bold text-acts-ink' : 'text-acts-ink'}>
        {label}
      </AppText>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType={modalAnimationType(reduceMotion, 'slide')}
      transparent
      onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute bottom-0 left-0 right-0 top-0 bg-black/40" onPress={onClose} accessibilityLabel="Dismiss" />
        <View className="max-h-[85%] rounded-t-3xl bg-acts-canvas px-5 pb-8 pt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <AppText variant="title">Filters</AppText>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close filters">
              <AppText variant="subtitle" className="text-acts-green">
                Done
              </AppText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <AppText variant="label" className="mb-2 text-acts-muted">
              Time
            </AppText>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {CADENCES.map(({ id, label }) => (
                <View key={id}>
                  {filterChip(label, filters.cadences.includes(id), () =>
                    onChange({ ...filters, cadences: toggleInList(filters.cadences, id) }),
                  )}
                </View>
              ))}
            </View>

            <AppText variant="label" className="mb-2 text-acts-muted">
              Difficulty
            </AppText>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {DIFFICULTIES.map(({ id, label }) => (
                <View key={id}>
                  {filterChip(label, filters.difficulties.includes(id), () =>
                    onChange({ ...filters, difficulties: toggleInList(filters.difficulties, id) }),
                  )}
                </View>
              ))}
            </View>

            <AppText variant="label" className="mb-2 text-acts-muted">
              Status
            </AppText>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {(
                [
                  { id: 'all' as const, label: 'All' },
                  { id: 'todo' as const, label: 'To do' },
                  { id: 'done' as const, label: 'Done' },
                ] as const
              ).map(({ id, label }) => (
                <View key={id}>{filterChip(label, filters.completion === id, () => onChange({ ...filters, completion: id }))}</View>
              ))}
            </View>

            <AppText variant="label" className="mb-2 text-acts-muted">
              Photo
            </AppText>
            <View className="mb-5 flex-row flex-wrap gap-2">
              {(
                [
                  { id: 'all' as const, label: 'All' },
                  { id: 'needs' as const, label: 'Photo suggested' },
                  { id: 'optional' as const, label: 'No photo prompt' },
                ] as const
              ).map(({ id, label }) => (
                <View key={id}>{filterChip(label, filters.photo === id, () => onChange({ ...filters, photo: id }))}</View>
              ))}
            </View>

            {sortedCategories.length > 0 ? (
              <>
                <AppText variant="label" className="mb-2 text-acts-muted">
                  Category
                </AppText>
                <View className="mb-5 flex-row flex-wrap gap-2">
                  {sortedCategories.map((cat) => (
                    <View key={cat}>
                      {filterChip(cat, filters.categories.includes(cat), () =>
                        onChange({ ...filters, categories: toggleInList(filters.categories, cat) }),
                      )}
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <AppButton
              title="Clear filters"
              variant="ghost"
              onPress={() => {
                onChange({ ...DEFAULT_TASK_LIST_FILTERS });
              }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
