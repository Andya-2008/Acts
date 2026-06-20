import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import type { TaskListViewMode } from '@/features/tasks/taskListViewStorage';
import { ActsTextInput, AppText } from '@/shared/components/ui';
import { getActsTextInputBoxStyle } from '@/shared/components/ui/actsTextInputMetrics';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { filterChipStyle } from '@/shared/utils/accessibilityMotion';

type TaskListToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  viewMode: TaskListViewMode;
  onViewModeChange: (mode: TaskListViewMode) => void;
  showViewModeToggle: boolean;
  activeFilterCount: number;
  onOpenFilters: () => void;
};

export function TaskListToolbar({
  searchQuery,
  onSearchQueryChange,
  viewMode,
  onViewModeChange,
  showViewModeToggle,
  activeFilterCount,
  onOpenFilters,
}: TaskListToolbarProps) {
  const act = useActAppearance();

  const modeChip = (mode: TaskListViewMode, label: string) => {
    const selected = viewMode === mode;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label} view${selected ? ', selected' : ''}`}
        onPress={() => onViewModeChange(mode)}
        className="flex-1 rounded-full border px-3 py-2"
        style={filterChipStyle(act.palette, selected)}>
        <AppText variant="caption" className={`text-center ${selected ? 'font-bold text-acts-ink' : 'text-acts-ink'}`}>
          {label}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View className="mb-3">
      <View className="mb-2 flex-row items-center rounded-2xl border border-acts-border bg-acts-surface px-3">
        <Ionicons name="search-outline" size={20} color="#9CA3AF" accessibilityIgnoresInvertColors />
        <ActsTextInput
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          placeholder="Search acts"
          placeholderTextColor="#9CA3AF"
          accessibilityLabel="Search acts"
          returnKeyType="search"
          clearButtonMode="while-editing"
          className="min-h-[44px] flex-1 border-0 bg-transparent text-acts-ink"
          style={getActsTextInputBoxStyle({ horizontalPadding: 8 })}
        />
        {searchQuery.trim().length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => onSearchQueryChange('')}
            hitSlop={8}
            className="p-1">
            <Ionicons name="close-circle" size={20} color="#9CA3AF" accessibilityIgnoresInvertColors />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2">
        {showViewModeToggle ? (
          <View className="min-w-0 flex-1 flex-row gap-2">
            {modeChip('focus', "Today's 3")}
            {modeChip('all', 'All acts')}
          </View>
        ) : (
          <View className="min-w-0 flex-1" />
        )}
        <Pressable
          onPress={onOpenFilters}
          accessibilityRole="button"
          accessibilityLabel="Open task filters"
          className="shrink-0 flex-row items-center rounded-2xl border border-acts-border bg-acts-surface px-4 py-2.5 active:opacity-80">
          <Ionicons name="options-outline" size={18} color="#374151" accessibilityIgnoresInvertColors />
          <AppText variant="subtitle" className="ml-1.5 text-acts-ink">
            Filters
          </AppText>
          {activeFilterCount > 0 ? (
            <View className="ml-2 min-w-[22px] items-center rounded-full bg-acts-green px-1.5 py-0.5">
              <AppText variant="caption" className="font-semibold text-white">
                {activeFilterCount}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}
