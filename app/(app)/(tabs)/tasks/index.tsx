import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  LayoutAnimation,
  ListRenderItem,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';

import { TaskListFiltersModal } from '@/features/tasks/components/TaskListFiltersModal';
import { TaskRewardFly } from '@/features/tasks/components/TaskRewardFly';
import { TaskRow, type TaskToggleOrigin } from '@/features/tasks/components/TaskRow';
import { authorDisplayNameForDeed } from '@/features/deed-feed/utils/authorDisplayName';
import { useCreateDeedPostMutation } from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { sliceAutoAssignableFromCatalog } from '@/features/tasks/constants/taskCatalog';
import {
  useAddTaskMutation,
  useClearTaskPhotoMutation,
  useEnsureAssignedTasksMutation,
  useSaveTaskPhotoMutation,
  useTaskCatalogQuery,
  useTasksQuery,
  useToggleTaskCompleteMutation,
} from '@/features/tasks/hooks/useTasksQueries';
import { taskMatchesUserProfile } from '@/features/tasks/utils/taskEligibility';
import { periodKeyForDate } from '@/features/tasks/utils/taskPeriodKeys';
import {
  activeFilterCount,
  DEFAULT_TASK_LIST_FILTERS,
  filtersAreActive,
  taskMatchesListFilters,
} from '@/features/tasks/utils/taskListFilters';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppButton, AppCard, AppText, FadeInView, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';
import { useCurrencyStore } from '@/shared/stores/currencyStore';
import type { ActTask } from '@/shared/types/task';
import { HEARTS_FOR_DEED_FEED_SHARE } from '@/shared/utils/deedFeedReward';
import { rewardForCadence } from '@/shared/utils/taskReward';

export default function TasksListScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const { data: tasks, isPending, isError, error, refetch, isRefetching } = useTasksQuery(uid);
  const { data: catalogEntries, isError: catalogIsError, error: catalogError, refetch: refetchCatalog, isFetching: catalogFetching } =
    useTaskCatalogQuery(Boolean(uid));
  const { data: userInfo } = useUserInfoQuery(uid);
  const ensureAssignedMutation = useEnsureAssignedTasksMutation(uid);
  const toggleMutation = useToggleTaskCompleteMutation(uid);
  const addMutation = useAddTaskMutation(uid);
  const saveTaskPhotoMutation = useSaveTaskPhotoMutation(uid);
  const clearTaskPhotoMutation = useClearTaskPhotoMutation(uid);
  const createDeedPostMutation = useCreateDeedPostMutation();

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const [newTitle, setNewTitle] = useState('');
  const [listFilters, setListFilters] = useState(DEFAULT_TASK_LIST_FILTERS);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [rewardFly, setRewardFly] = useState<{
    key: number;
    taskId: string;
    card: { x: number; y: number; width: number; height: number };
    ex: number;
    ey: number;
    heartCount: number;
  } | null>(null);
  const flyAmountRef = useRef(0);
  const autoAssignAttempted = useRef(false);
  const periodSigRef = useRef('');
  const [homeRosterVersion, setHomeRosterVersion] = useState(0);

  const bumpHomeRosterIfPeriodChanged = useCallback(() => {
    const n = new Date();
    const sig = [
      periodKeyForDate('daily', n) ?? '',
      periodKeyForDate('weekly', n) ?? '',
      periodKeyForDate('monthly', n) ?? '',
    ].join('|');
    if (sig !== periodSigRef.current) {
      periodSigRef.current = sig;
      setHomeRosterVersion((v) => v + 1);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      bumpHomeRosterIfPeriodChanged();
    }, [bumpHomeRosterIfPeriodChanged]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        bumpHomeRosterIfPeriodChanged();
      }
    });
    return () => sub.remove();
  }, [bumpHomeRosterIfPeriodChanged]);

  const assignableFromCatalog = useMemo(
    () => sliceAutoAssignableFromCatalog(catalogEntries ?? [], new Date()),
    [catalogEntries, homeRosterVersion],
  );

  const homeRosterCatalogIds = useMemo(
    () => new Set(assignableFromCatalog.map((c) => c.taskId)),
    [assignableFromCatalog],
  );

  const visibleTasks = useMemo(() => {
    const filtered = (tasks ?? []).filter((t) => {
      if (!t.active) {
        return false;
      }
      if (homeRosterCatalogIds.has(t.id)) {
        return true;
      }
      if (t.cadence === 'anytime' || t.taskId.startsWith('custom_')) {
        return taskMatchesUserProfile(t, userInfo ?? undefined);
      }
      return false;
    });
    const flyingId = rewardFly?.taskId;
    const isCompleteForLayout = (t: ActTask) =>
      t.completedAt != null && (flyingId == null || t.id !== flyingId);

    const incomplete = filtered.filter((t) => !isCompleteForLayout(t));
    const complete = filtered.filter((t) => isCompleteForLayout(t));
    incomplete.sort((a, b) => b.sortKey - a.sortKey);
    complete.sort((a, b) => b.sortKey - a.sortKey);
    return [...incomplete, ...complete];
  }, [tasks, userInfo, rewardFly?.taskId, homeRosterCatalogIds]);

  const categoryOptions = useMemo(() => {
    const s = new Set<string>();
    for (const t of tasks ?? []) {
      const c = t.category?.trim();
      if (c) {
        s.add(c);
      }
    }
    return [...s];
  }, [tasks]);

  const displayedTasks = useMemo(
    () => visibleTasks.filter((t) => taskMatchesListFilters(t, listFilters)),
    [visibleTasks, listFilters],
  );

  const prevVisibleLen = useRef(0);
  useEffect(() => {
    const n = displayedTasks.length;
    if (n > 0 && prevVisibleLen.current === 0) {
      LayoutAnimation.configureNext({
        duration: 340,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
        create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      });
    }
    prevVisibleLen.current = n;
  }, [displayedTasks.length]);

  useEffect(() => {
    autoAssignAttempted.current = false;
  }, [uid]);

  useEffect(() => {
    if (!uid || isPending || tasks === undefined) {
      return;
    }
    if (tasks.length > 0 || autoAssignAttempted.current) {
      return;
    }
    autoAssignAttempted.current = true;
    ensureAssignedMutation.mutate(undefined, {
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [uid, isPending, tasks, ensureAssignedMutation]);

  const missingCatalogCount = useMemo(() => {
    const ids = new Set((tasks ?? []).map((t) => t.id));
    return assignableFromCatalog.filter((c) => !ids.has(c.taskId)).length;
  }, [tasks, assignableFromCatalog]);

  const onRefresh = useCallback(() => {
    bumpHomeRosterIfPeriodChanged();
    void Promise.all([refetch(), refetchCatalog()]);
  }, [refetch, refetchCatalog, bumpHomeRosterIfPeriodChanged]);

  const onRewardFlyFinished = useCallback(() => {
    useCurrencyStore.getState().adjustBalance(flyAmountRef.current);
    LayoutAnimation.configureNext({
      duration: 380,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setRewardFly(null);
  }, []);

  const uploadPickedTaskPhoto = useCallback(
    (task: ActTask, uri: string | undefined) => {
      if (!uri) {
        return;
      }
      setLocalError(null);
      saveTaskPhotoMutation.mutate(
        { taskId: task.id, localUri: uri },
        { onError: (e) => setLocalError(mapAuthError(e)) },
      );
    },
    [saveTaskPhotoMutation],
  );

  const pickTaskPhotoFromLibrary = useCallback(
    async (task: ActTask) => {
      if (Platform.OS === 'web') {
        setLocalError('Task pictures can be added from the iOS or Android app.');
        return;
      }
      setLocalError(null);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setLocalError('Photo library access was denied. You can enable it in system settings.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (picked.canceled) {
        return;
      }
      uploadPickedTaskPhoto(task, picked.assets[0]?.uri);
    },
    [uploadPickedTaskPhoto],
  );

  const pickTaskPhotoFromCamera = useCallback(
    async (task: ActTask) => {
      if (Platform.OS === 'web') {
        setLocalError('Task pictures can be added from the iOS or Android app.');
        return;
      }
      setLocalError(null);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setLocalError('Camera access was denied. You can enable it in system settings.');
        return;
      }
      const picked = await ImagePicker.launchCameraAsync({
        quality: 0.85,
      });
      if (picked.canceled) {
        return;
      }
      uploadPickedTaskPhoto(task, picked.assets[0]?.uri);
    },
    [uploadPickedTaskPhoto],
  );

  const onToggle = useCallback(
    (task: ActTask, origin?: TaskToggleOrigin) => {
      setLocalError(null);
      const next = task.completedAt == null;
      const reward = rewardForCadence(task.cadence);
      toggleMutation.mutate(
        { taskId: task.id, completed: next },
        {
          onSuccess: () => {
            if (!next) {
              useCurrencyStore.getState().adjustBalance(-reward);
              return;
            }
            if (reward <= 0) {
              return;
            }
            const anchor = useCurrencyStore.getState().pillAnchor;
            if (origin?.card && anchor) {
              flyAmountRef.current = reward;
              setRewardFly({
                key: Date.now(),
                taskId: task.id,
                card: origin.card,
                ex: anchor.x,
                ey: anchor.y,
                heartCount: reward,
              });
            } else {
              useCurrencyStore.getState().adjustBalance(reward);
            }
          },
          onError: (e) => setLocalError(mapAuthError(e)),
        },
      );
    },
    [toggleMutation],
  );

  const onAddCustom = useCallback(() => {
    setLocalError(null);
    const t = newTitle.trim();
    if (!t) {
      return;
    }
    addMutation.mutate(t, {
      onSuccess: () => setNewTitle(''),
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [addMutation, newTitle]);

  const onEnsureAssigned = useCallback(() => {
    setLocalError(null);
    ensureAssignedMutation.mutate(undefined, {
      onError: (e) => setLocalError(mapAuthError(e)),
    });
  }, [ensureAssignedMutation]);

  const removeTaskPhoto = useCallback(
    (task: ActTask) => {
      setLocalError(null);
      clearTaskPhotoMutation.mutate(task.id, {
        onError: (e) => setLocalError(mapAuthError(e)),
      });
    },
    [clearTaskPhotoMutation],
  );

  const shareToDeedFeed = useCallback(
    (task: ActTask) => {
      if (task.deedFeedPostId) {
        return;
      }
      const url = task.photoUrl?.trim();
      if (!uid || !url) {
        return;
      }
      setLocalError(null);
      const authorDisplayName = authorDisplayNameForDeed(userInfo ?? undefined, user);
      const authorProfilePicUrl = userInfo?.profilePicUrl?.trim() || user?.photoURL?.trim() || '';
      createDeedPostMutation.mutate(
        {
          uid,
          authorDisplayName,
          authorProfilePicUrl,
          caption: task.textShort.trim(),
          photoSourceUri: url,
          sourceTaskId: task.id,
        },
        {
          onSuccess: () => {
            useCurrencyStore.getState().adjustBalance(HEARTS_FOR_DEED_FEED_SHARE);
          },
          onError: (e) => setLocalError(mapAuthError(e)),
        },
      );
    },
    [uid, user, userInfo, createDeedPostMutation],
  );

  const photoActionTaskId = saveTaskPhotoMutation.isPending
    ? saveTaskPhotoMutation.variables?.taskId ?? null
    : clearTaskPhotoMutation.isPending
      ? clearTaskPhotoMutation.variables ?? null
      : null;

  const deedFeedShareTaskId =
    createDeedPostMutation.isPending && createDeedPostMutation.variables?.sourceTaskId
      ? createDeedPostMutation.variables.sourceTaskId
      : null;

  const renderItem: ListRenderItem<ActTask> = useCallback(
    ({ item }) => (
      <TaskRow
        task={item}
        busy={toggleMutation.isPending}
        hideForRewardFly={rewardFly?.taskId === item.id}
        onToggleComplete={(origin) => onToggle(item, origin)}
        onPickTaskPhotoFromLibrary={Platform.OS === 'web' ? undefined : pickTaskPhotoFromLibrary}
        onPickTaskPhotoFromCamera={Platform.OS === 'web' ? undefined : pickTaskPhotoFromCamera}
        onRemoveTaskPhoto={removeTaskPhoto}
        photoActionTaskId={photoActionTaskId}
        onShareToDeedFeed={Platform.OS === 'web' ? undefined : shareToDeedFeed}
        deedFeedShareTaskId={deedFeedShareTaskId}
      />
    ),
    [
      onToggle,
      rewardFly?.taskId,
      toggleMutation.isPending,
      pickTaskPhotoFromLibrary,
      pickTaskPhotoFromCamera,
      removeTaskPhoto,
      photoActionTaskId,
      shareToDeedFeed,
      deedFeedShareTaskId,
    ],
  );

  const listHeader = useMemo(() => {
    const nActive = activeFilterCount(listFilters);
    return (
      <View className="mb-3">
        <Pressable
          onPress={() => setFiltersModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open task filters"
          className="mb-2 flex-row items-center self-start rounded-2xl border border-acts-border bg-acts-surface px-4 py-2.5 active:opacity-80">
          <AppText variant="subtitle">Filters</AppText>
          {nActive > 0 ? (
            <View className="ml-2 min-w-[22px] items-center rounded-full bg-acts-green px-1.5 py-0.5">
              <AppText variant="caption" className="font-semibold text-white">
                {nActive}
              </AppText>
            </View>
          ) : null}
        </Pressable>
        {catalogIsError ? (
          <AppCard className="mb-3 border-acts-danger/30 bg-acts-surface p-3">
            <AppText variant="caption" className="mb-3 text-acts-danger">
              {mapAuthError(catalogError)}
            </AppText>
            <AppButton title="Retry" variant="secondary" onPress={() => void refetchCatalog()} />
          </AppCard>
        ) : null}
        {localError ? (
          <AppText variant="caption" className="text-acts-danger">
            {localError}
          </AppText>
        ) : null}
      </View>
    );
  }, [catalogIsError, catalogError, localError, refetchCatalog, listFilters]);

  const listEmpty = useMemo(() => {
    if (ensureAssignedMutation.isPending && (tasks?.length ?? 0) === 0) {
      return (
        <View className="mb-4 items-center py-10">
          <ActivityIndicator size="large" color="#E11D74" />
        </View>
      );
    }
    if (
      (tasks?.length ?? 0) === 0 &&
      catalogFetching &&
      !ensureAssignedMutation.isPending &&
      catalogEntries === undefined
    ) {
      return (
        <View className="mb-4 items-center py-10">
          <ActivityIndicator size="large" color="#E11D74" />
        </View>
      );
    }
    if (visibleTasks.length > 0 && displayedTasks.length === 0 && filtersAreActive(listFilters)) {
      return (
        <View className="mb-4 items-center px-4 py-10">
          <AppButton title="Clear filters" variant="secondary" onPress={() => setListFilters({ ...DEFAULT_TASK_LIST_FILTERS })} />
        </View>
      );
    }
    if ((tasks?.length ?? 0) > 0 && visibleTasks.length === 0) {
      return <View className="py-6" />;
    }
    return (
      <AppCard className="mb-4">
        <AppButton
          title="Load suggested acts"
          variant="secondary"
          loading={ensureAssignedMutation.isPending}
          onPress={onEnsureAssigned}
        />
      </AppCard>
    );
  }, [
    ensureAssignedMutation.isPending,
    tasks,
    visibleTasks.length,
    displayedTasks.length,
    listFilters,
    onEnsureAssigned,
    catalogFetching,
    catalogEntries,
  ]);

  const listFooter = (
    <View className="mt-2 pb-4">
      {missingCatalogCount > 0 ? (
        <FadeInView>
          <AppCard className="mb-4">
            <AppButton
              title="Sync suggested acts"
              variant="secondary"
              loading={ensureAssignedMutation.isPending}
              onPress={onEnsureAssigned}
            />
          </AppCard>
        </FadeInView>
      ) : null}
      <TextInput
        value={newTitle}
        onChangeText={setNewTitle}
        placeholder="Add your own act"
        placeholderTextColor="#9CA3AF"
        className="mb-3 rounded-2xl border border-acts-border bg-acts-surface px-4 py-3.5 text-base text-acts-ink"
        editable={!addMutation.isPending}
        onSubmitEditing={onAddCustom}
        returnKeyType="done"
      />
      <AppButton
        title="Add act"
        loading={addMutation.isPending}
        disabled={!newTitle.trim()}
        onPress={onAddCustom}
      />
    </View>
  );

  if (!uid) {
    return (
      <Screen>
        <FadeInView>
          <View>
            <AppText variant="body">Sign in to continue.</AppText>
          </View>
        </FadeInView>
      </Screen>
    );
  }

  if (isPending && !tasks) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color="#E11D74" />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen scroll>
        <FadeInView>
          <View>
            <AppText variant="caption" className="mb-4 text-acts-danger">
              {mapAuthError(error)}
            </AppText>
            <AppButton title="Try again" onPress={() => void Promise.all([refetch(), refetchCatalog()])} />
          </View>
        </FadeInView>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <TaskListFiltersModal
        visible={filtersModalOpen}
        onClose={() => setFiltersModalOpen(false)}
        filters={listFilters}
        onChange={setListFilters}
        categoryOptions={categoryOptions}
      />
      <FlatList
        className="flex-1"
        data={displayedTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#E11D74" />}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
      />
      <Modal visible={rewardFly != null} transparent animationType="none" statusBarTranslucent>
        <View style={{ flex: 1 }} pointerEvents="box-none">
          {rewardFly ? (
            <TaskRewardFly
              flyKey={rewardFly.key}
              card={rewardFly.card}
              endX={rewardFly.ex}
              endY={rewardFly.ey}
              heartCount={rewardFly.heartCount}
              onFinished={onRewardFlyFinished}
            />
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}
