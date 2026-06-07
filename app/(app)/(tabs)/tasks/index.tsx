import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  ListRenderItem,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  UIManager,
  View,
  type FlatList as FlatListType,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';

import { FirstActSpotlightCard } from '@/features/tasks/components/FirstActSpotlightCard';
import { TaskListFiltersModal } from '@/features/tasks/components/TaskListFiltersModal';
import { TaskRewardFly } from '@/features/tasks/components/TaskRewardFly';
import { TaskRow, type TaskToggleOrigin } from '@/features/tasks/components/TaskRow';
import {
  getFirstActPromptDone,
  setFirstActPromptDone,
} from '@/features/tasks/firstActPromptStorage';
import { pickFirstActCandidate } from '@/features/tasks/utils/pickFirstActCandidate';
import { addSeenTaskIds, loadSeenTaskIds, taskSeenKey } from '@/features/tasks/taskSeenStorage';
import { authorDisplayNameForDeed } from '@/features/deed-feed/utils/authorDisplayName';
import { ownedTaskThemeSet } from '@/features/shop/shopCatalog';
import { autoAssignPerCadenceFromPurchases } from '@/features/shop/shopEntitlements';
import { useCreateDeedPostMutation } from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { sliceAutoAssignableFromCatalog } from '@/features/tasks/constants/taskCatalog';
import { currentRosterPeriodKeys } from '@/features/tasks/utils/taskPeriodKeys';
import {
  useAddTaskMutation,
  useClearTaskPhotoMutation,
  useEnsureAssignedTasksMutation,
  useSaveTaskPhotoMutation,
  useTaskCatalogQuery,
  useTasksQuery,
  useToggleTaskCompleteMutation,
} from '@/features/tasks/hooks/useTasksQueries';
import { catalogEntryMatchesUser, taskMatchesUserProfile } from '@/features/tasks/utils/taskEligibility';
import { periodKeyForDate } from '@/features/tasks/utils/taskPeriodKeys';
import {
  activeFilterCount,
  DEFAULT_TASK_LIST_FILTERS,
  filtersAreActive,
  taskMatchesListFilters,
} from '@/features/tasks/utils/taskListFilters';
import {
  FriendsCirclePromptCard,
  shouldShowFriendsCirclePrompt,
} from '@/features/friends/components/FriendsCirclePromptCard';
import { useFriendUidsQuery } from '@/features/friends/hooks/useFriendsQueries';
import { mapAuthError } from '@/features/auth/utils/mapAuthError';
import { ServiceRankUpOverlay, type ServiceRankUpPayload } from '@/features/user-profile/components/ServiceRankUpOverlay';
import { computeLifetimeRankPromotionTransition } from '@/features/user-profile/config/xpServiceRanks';
import { useMergeActsSettingsMutation } from '@/features/user-profile/hooks/useUserInfoMutations';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { grantLifetimeXp } from '@/features/user-profile/services/userInfoRepository';
import {
  canOfferStreakGraceSave,
  calendarMonthKey,
} from '@/features/user-profile/utils/computeCompletionStreak';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { celebrateTaskComplete, taskUncheckedHaptic } from '@/shared/utils/haptics';
import { preferredDifficultyLevelFromActs } from '@/shared/utils/preferredTaskDifficulty';
import { resolveEquippedTaskCheckTheme } from '@/features/cosmetics/taskCheckThemes';
import { ActsTextInput, AppButton, AppCard, AppText, FadeInView, Screen, TitleWithInfo } from '@/shared/components/ui';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { configureActsLayoutAnimation } from '@/shared/utils/accessibilityMotion';
import { getActsTextInputBoxStyle } from '@/shared/components/ui/actsTextInputMetrics';
import { useAuthStore } from '@/shared/stores/authStore';
import { useCurrencyStore } from '@/shared/stores/currencyStore';
import { useTutorialGateStore } from '@/shared/stores/tutorialGateStore';
import type { ActTask } from '@/shared/types/task';
import { HEARTS_FOR_DEED_FEED_SHARE } from '@/shared/utils/deedFeedReward';
import { rewardForCadence } from '@/shared/utils/taskReward';
import { XP_FOR_DEED_FEED_SHARE, xpForCadence } from '@/shared/utils/xpRewards';
import { isWeekendDoubleActive, weekendDoubleEarnedAmount, weekendDoubleXpDelta } from '@/shared/utils/weekendDouble';

export default function TasksListScreen() {
  const reduceMotion = useReduceMotion();
  const uid = useAuthStore((s) => s.user?.uid);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data: tasks, isPending, isError, error, refetch, isRefetching } = useTasksQuery(uid);
  const { data: catalogEntries, isError: catalogIsError, error: catalogError, refetch: refetchCatalog, isFetching: catalogFetching } =
    useTaskCatalogQuery(Boolean(uid));
  const { data: userInfo } = useUserInfoQuery(uid);
  const friendUidsQuery = useFriendUidsQuery(uid);
  const friendCount = friendUidsQuery.data?.length ?? 0;
  const showGrowFriendsPrompt =
    friendUidsQuery.isFetched && shouldShowFriendsCirclePrompt(friendCount);
  const tutorialOpen = useTutorialGateStore((s) => s.firstRunTutorialOpen);
  const listRef = useRef<FlatListType<ActTask>>(null);
  const [firstActPromptDone, setFirstActPromptDoneState] = useState<boolean | null>(null);

  useEffect(() => {
    if (!uid) {
      setFirstActPromptDoneState(null);
      return;
    }
    void getFirstActPromptDone(uid).then(setFirstActPromptDoneState);
  }, [uid]);

  const hasCompletedAnyAct = useMemo(
    () => (tasks ?? []).some((t) => t.completedAt != null),
    [tasks],
  );

  useEffect(() => {
    if (!uid || !hasCompletedAnyAct || firstActPromptDone === true) {
      return;
    }
    void setFirstActPromptDone(uid).then(() => setFirstActPromptDoneState(true));
  }, [uid, hasCompletedAnyAct, firstActPromptDone]);

  const actsSettingsForGrace = useMemo(() => mergeActsDefaults(userInfo?.ActsSettings), [userInfo?.ActsSettings]);
  const streakGraceOffer = useMemo(
    () => canOfferStreakGraceSave(tasks ?? [], actsSettingsForGrace),
    [tasks, actsSettingsForGrace.streakGraceForgivenDayKey, actsSettingsForGrace.streakGraceAppliedInMonth],
  );
  const mergeActsSettingsMutation = useMergeActsSettingsMutation(uid);
  const equippedTaskCheckTheme = useMemo(() => {
    const acts = mergeActsDefaults(userInfo?.ActsSettings);
    const ownedThemes = ownedTaskThemeSet(userInfo?.ShopPurchasedIds);
    return resolveEquippedTaskCheckTheme(acts.activeTaskCheckTheme, ownedThemes);
  }, [userInfo?.ActsSettings, userInfo?.ShopPurchasedIds]);
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
  const pendingRankUpRef = useRef<ServiceRankUpPayload | null>(null);
  const autoAssignAttempted = useRef(false);
  const periodSigRef = useRef('');
  const [homeRosterVersion, setHomeRosterVersion] = useState(0);
  const [rankUpPayload, setRankUpPayload] = useState<ServiceRankUpPayload | null>(null);

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

  /** Period rollover runs in `fetchTasksForUser` → `reconcilePeriodRosters`. */
  useEffect(() => {
    if (!uid || homeRosterVersion < 1) {
      return;
    }
    void refetch();
  }, [homeRosterVersion, uid, refetch]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        bumpHomeRosterIfPeriodChanged();
      }
    });
    return () => sub.remove();
  }, [bumpHomeRosterIfPeriodChanged]);

  const profileFilteredCatalog = useMemo(
    () => (catalogEntries ?? []).filter((e) => catalogEntryMatchesUser(e, userInfo ?? undefined)),
    [catalogEntries, userInfo],
  );

  const rosterPeriodKeys = useMemo(() => currentRosterPeriodKeys(), [homeRosterVersion]);

  const assignableFromCatalog = useMemo(() => {
    const acts = mergeActsDefaults(userInfo?.ActsSettings);
    return sliceAutoAssignableFromCatalog(
      profileFilteredCatalog,
      new Date(),
      autoAssignPerCadenceFromPurchases(userInfo?.ShopPurchasedIds),
      {
        uid,
        preferredDifficultyLevel: preferredDifficultyLevelFromActs(acts.preferredDifficulty),
      },
    );
  }, [profileFilteredCatalog, homeRosterVersion, userInfo?.ShopPurchasedIds, userInfo?.ActsSettings, uid]);

  const homeRosterCatalogIds = useMemo(
    () => new Set(assignableFromCatalog.map((c) => c.taskId)),
    [assignableFromCatalog],
  );

  const visibleTasks = useMemo(() => {
    const filtered = (tasks ?? []).filter((t) => {
      if (!t.active) {
        return false;
      }
      const isCatalogCadence =
        t.cadence === 'daily' || t.cadence === 'weekly' || t.cadence === 'monthly';
      if (isCatalogCadence && homeRosterCatalogIds.has(t.id)) {
        const periodKey =
          t.cadence === 'daily'
            ? rosterPeriodKeys.daily
            : t.cadence === 'weekly'
              ? rosterPeriodKeys.weekly
              : rosterPeriodKeys.monthly;
        return periodKey != null && t.assignedPeriodKey === periodKey;
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
  }, [tasks, userInfo, rewardFly?.taskId, homeRosterCatalogIds, rosterPeriodKeys]);

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

  // "New" markers: acts the user hasn't seen on this tab yet. Seen state is loaded
  // once per focus (so badges stay stable during a visit) and persisted on blur.
  const [seenTaskIds, setSeenTaskIds] = useState<Set<string> | null>(null);
  const displayedTaskSeenKeysRef = useRef<string[]>([]);
  useEffect(() => {
    displayedTaskSeenKeysRef.current = displayedTasks.map((t) => taskSeenKey(t));
  }, [displayedTasks]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (uid) {
        void loadSeenTaskIds(uid).then((set) => {
          if (active) {
            setSeenTaskIds(set);
          }
        });
      } else {
        setSeenTaskIds(new Set());
      }
      return () => {
        active = false;
        if (uid && displayedTaskSeenKeysRef.current.length > 0) {
          void addSeenTaskIds(uid, displayedTaskSeenKeysRef.current);
        }
      };
    }, [uid]),
  );

  const newTaskIds = useMemo(() => {
    if (!seenTaskIds) {
      return new Set<string>();
    }
    const out = new Set<string>();
    for (const t of displayedTasks) {
      if (t.completedAt == null && !seenTaskIds.has(taskSeenKey(t))) {
        out.add(t.id);
      }
    }
    return out;
  }, [seenTaskIds, displayedTasks]);

  const firstActCandidate = useMemo(() => pickFirstActCandidate(visibleTasks), [visibleTasks]);

  const showFirstActSpotlight =
    firstActPromptDone === false &&
    !tutorialOpen &&
    !hasCompletedAnyAct &&
    firstActCandidate != null &&
    displayedTasks.some((t) => t.id === firstActCandidate.id);

  const scrollToFirstAct = useCallback(() => {
    const index = displayedTasks.findIndex((t) => t.id === firstActCandidate?.id);
    if (index < 0) {
      return;
    }
    listRef.current?.scrollToIndex({ index, viewOffset: 140, animated: true });
  }, [displayedTasks, firstActCandidate?.id]);

  const dismissFirstActSpotlight = useCallback(() => {
    if (!uid) {
      return;
    }
    void setFirstActPromptDone(uid).then(() => setFirstActPromptDoneState(true));
  }, [uid]);

  const prevVisibleLen = useRef(0);
  useEffect(() => {
    const n = displayedTasks.length;
    if (n > 0 && prevVisibleLen.current === 0) {
      configureActsLayoutAnimation(reduceMotion);
    }
    prevVisibleLen.current = n;
  }, [displayedTasks.length, reduceMotion]);

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
    configureActsLayoutAnimation(reduceMotion);
    setRewardFly(null);
    const pending = pendingRankUpRef.current;
    pendingRankUpRef.current = null;
    if (pending) {
      setRankUpPayload(pending);
    }
  }, [reduceMotion]);

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
      const prevXp = Math.max(0, Math.floor(Number(userInfo?.LifetimeXP ?? 0)));
      toggleMutation.mutate(
        {
          taskId: task.id,
          completed: next,
          completionLedger: next
            ? {
                seeds: weekendDoubleEarnedAmount(reward),
                xp: weekendDoubleXpDelta(xpForCadence(task.cadence)),
              }
            : null,
        },
        {
          onSuccess: () => {
            if (!next) {
              taskUncheckedHaptic();
              const seedsToRevoke = task.lastCompletionSeeds ?? rewardForCadence(task.cadence);
              const xpToRevoke = task.lastCompletionXp ?? xpForCadence(task.cadence);
              useCurrencyStore.getState().adjustBalance(-seedsToRevoke);
              if (xpToRevoke > 0 && uid) {
                void grantLifetimeXp(uid, -xpToRevoke).then(() =>
                  queryClient.invalidateQueries({ queryKey: userInfoQueryKeys.detail(uid) }),
                );
              }
              return;
            }
            celebrateTaskComplete();
            const xpGain = weekendDoubleXpDelta(xpForCadence(task.cadence));
            const transition = xpGain > 0 ? computeLifetimeRankPromotionTransition(prevXp, xpGain) : null;
            if (xpGain > 0 && uid) {
              void grantLifetimeXp(uid, xpGain).then(() =>
                queryClient.invalidateQueries({ queryKey: userInfoQueryKeys.detail(uid) }),
              );
            }
            const grantSeeds = weekendDoubleEarnedAmount(reward);
            if (grantSeeds <= 0) {
              if (transition) {
                setRankUpPayload(transition);
              }
              return;
            }
            const anchor = useCurrencyStore.getState().pillAnchor;
            if (origin?.card && anchor) {
              flyAmountRef.current = grantSeeds;
              if (transition) {
                pendingRankUpRef.current = transition;
              }
              setRewardFly({
                key: Date.now(),
                taskId: task.id,
                card: origin.card,
                ex: anchor.x,
                ey: anchor.y,
                heartCount: grantSeeds,
              });
            } else {
              useCurrencyStore.getState().adjustBalance(grantSeeds);
              if (transition) {
                setRankUpPayload(transition);
              }
            }
          },
          onError: (e) => setLocalError(mapAuthError(e)),
        },
      );
    },
    [toggleMutation, uid, queryClient, userInfo?.LifetimeXP],
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
            const hearts = weekendDoubleEarnedAmount(HEARTS_FOR_DEED_FEED_SHARE);
            const xpGrant = weekendDoubleXpDelta(XP_FOR_DEED_FEED_SHARE);
            useCurrencyStore.getState().adjustBalance(hearts);
            if (uid) {
              const prevXp = Math.max(0, Math.floor(Number(userInfo?.LifetimeXP ?? 0)));
              const transition = computeLifetimeRankPromotionTransition(prevXp, xpGrant);
              void grantLifetimeXp(uid, xpGrant).then(() => {
                void queryClient.invalidateQueries({ queryKey: userInfoQueryKeys.detail(uid) });
                if (transition) {
                  setRankUpPayload(transition);
                }
              });
            }
          },
          onError: (e) => setLocalError(mapAuthError(e)),
        },
      );
    },
    [uid, user, userInfo, createDeedPostMutation, queryClient],
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
        taskCheckThemeId={equippedTaskCheckTheme}
        isNew={newTaskIds.has(item.id)}
        spotlight={showFirstActSpotlight && item.id === firstActCandidate?.id}
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
      equippedTaskCheckTheme,
      newTaskIds,
      showFirstActSpotlight,
      firstActCandidate?.id,
    ],
  );

  const listHeader = useMemo(() => {
    const nActive = activeFilterCount(listFilters);
    return (
      <View className="mb-3">
        <AppCard className="mb-3 border-acts-green/40 bg-acts-green-soft/70 p-4">
          <TitleWithInfo
            title="Make up your own act"
            className="mb-3"
            infoText="Acts aren't limited to our suggestions - add any kind thing you want to do and earn the same rewards."
          />
          <ActsTextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Add your own act"
            placeholderTextColor="#9CA3AF"
            className="mb-3 rounded-2xl border border-acts-border bg-acts-surface text-acts-ink"
            style={getActsTextInputBoxStyle()}
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
        </AppCard>
        {showGrowFriendsPrompt ? (
          <FriendsCirclePromptCard
            variant="tasks_grow"
            friendCount={friendCount}
            className="mb-3"
          />
        ) : null}
        {showFirstActSpotlight && firstActCandidate ? (
          <FirstActSpotlightCard
            task={firstActCandidate}
            className="mb-3"
            onScrollToAct={scrollToFirstAct}
            onDismiss={dismissFirstActSpotlight}
          />
        ) : null}
        {isWeekendDoubleActive() ? (
          <AppCard className="mb-3 border-acts-green/35 bg-acts-green-soft/80 p-3">
            <TitleWithInfo
              title="Double seeds & XP weekend"
              infoText="Friday-Sunday: task rewards, deed-feed bonuses, and shop XP boosts pay out twice."
            />
          </AppCard>
        ) : null}
        {streakGraceOffer.show ? (
          <AppCard className="mb-3 border-acts-green/45 bg-acts-green-soft p-3">
            <TitleWithInfo
              title="Save your streak"
              className="mb-3"
              infoText="You missed yesterday but your run is still recoverable. You can use one streak save per calendar month."
            />
            <AppButton
              title="Use monthly streak save"
              loading={mergeActsSettingsMutation.isPending}
              disabled={mergeActsSettingsMutation.isPending || !streakGraceOffer.forgivenDayKey}
              onPress={() => {
                const key = streakGraceOffer.forgivenDayKey;
                if (!key) {
                  return;
                }
                void mergeActsSettingsMutation.mutateAsync({
                  streakGraceForgivenDayKey: key,
                  streakGraceAppliedInMonth: calendarMonthKey(new Date()),
                });
              }}
            />
          </AppCard>
        ) : null}
        <TitleWithInfo
          title="Suggested acts"
          variant="label"
          className="mb-3"
          infoText="Suggested acts match your age, traits, and difficulty preference, then rotate with the calendar. Change difficulty under Settings → Preferences."
        />
        <Pressable
          onPress={() => setFiltersModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open task filters"
          className="mb-2 flex-row items-center self-start rounded-2xl border border-acts-border bg-acts-surface px-4 py-2.5 active:opacity-80">
          <AppText variant="subtitle" className="text-acts-ink">
            Filters
          </AppText>
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
  }, [
    catalogIsError,
    catalogError,
    localError,
    refetchCatalog,
    listFilters,
    streakGraceOffer.show,
    streakGraceOffer.forgivenDayKey,
    mergeActsSettingsMutation.isPending,
    newTitle,
    addMutation.isPending,
    onAddCustom,
    showGrowFriendsPrompt,
    friendCount,
    showFirstActSpotlight,
    firstActCandidate,
    scrollToFirstAct,
    dismissFirstActSpotlight,
  ]);

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
        ref={listRef}
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
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: Math.max(0, info.averageItemLength * info.index),
            animated: true,
          });
        }}
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
      <ServiceRankUpOverlay payload={rankUpPayload} onClose={() => setRankUpPayload(null)} />
    </Screen>
  );
}
