import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ACHIEVEMENTS,
  ACHIEVEMENT_SECTION_FLAVOR,
  ACHIEVEMENT_SECTION_LABEL,
  ACHIEVEMENT_SECTION_ORDER,
  achievementHowToUnlock,
  achievementProgressSummary,
  isAchievementUnlocked,
  type AchievementCategory,
  type AchievementDef,
  type AchievementMetrics,
} from '@/features/achievements/achievementCatalog';
import { useMyDeedPostsQuery } from '@/features/deed-feed/hooks/useDeedPostsQueries';
import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';
import { computeCompletionStreak } from '@/features/user-profile/utils/computeCompletionStreak';
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQueries';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { AppButton, AppCard, AppText, Screen, TitleWithInfo } from '@/shared/components/ui';
import { mergeActsDefaults } from '@/shared/types/actsSettings';
import { HeaderBackLabel } from '@/shared/components/HeaderBackLabel';
import { stackHeaderChrome } from '@/shared/navigation/stackHeaderChrome';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';

const SECTION_ACCENT: Record<AchievementCategory, string> = {
  streak: '#F97316',
  xp: '#EAB308',
  acts: '#22C55E',
  deed_feed: '#E11D74',
};

function BadgeTile({
  def,
  unlocked,
  width,
  onPress,
}: {
  def: AchievementDef;
  unlocked: boolean;
  width: number;
  onPress: () => void;
}) {
  const pad = 8;
  const tile = (width - pad * 2) / 4 - pad;
  const iconSize = Math.min(30, tile * 0.45);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${def.title}. ${unlocked ? 'Unlocked' : 'Locked'}. Tap for how to earn.`}
      onPress={onPress}
      className="mb-3 items-center px-2 active:opacity-85"
      style={{ width: width / 4 }}>
      <View
        className="items-center justify-center rounded-2xl border-2"
        style={{
          width: tile,
          height: tile,
          borderColor: unlocked ? `${def.accentHex}99` : 'rgba(100,100,120,0.45)',
          backgroundColor: unlocked ? `${def.accentHex}28` : 'rgba(80,80,100,0.2)',
          ...Platform.select({
            ios: {
              shadowColor: unlocked ? def.accentHex : '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: unlocked ? 0.35 : 0.12,
              shadowRadius: unlocked ? 6 : 3,
            },
            android: { elevation: unlocked ? 5 : 2 },
          }),
        }}>
        {!unlocked ? (
          <View className="absolute right-1 top-1 rounded-full bg-black/25 p-0.5">
            <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.9)" />
          </View>
        ) : null}
        <Ionicons name={def.icon} size={iconSize} color={unlocked ? def.accentHex : '#9CA3AF'} />
      </View>
      <AppText
        variant="caption"
        numberOfLines={2}
        className={`mt-1.5 text-center text-[11px] font-semibold leading-[14px] ${unlocked ? 'text-acts-ink' : 'text-acts-muted'}`}
        style={{ opacity: unlocked ? 1 : 0.65 }}>
        {def.title}
      </AppText>
    </Pressable>
  );
}

function AchievementDetailModal({
  def,
  metrics,
  visible,
  onClose,
}: {
  def: AchievementDef | null;
  metrics: AchievementMetrics;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const unlocked = def ? isAchievementUnlocked(def, metrics) : false;

  if (!def) {
    return null;
  }

  const how = achievementHowToUnlock(def);
  const progress = achievementProgressSummary(def, metrics);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={modalAnimationType(reduceMotion, 'fade')}
      onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/55"
        onPress={onClose}
        accessibilityLabel="Dismiss achievement details">
        <Pressable
          className="rounded-t-3xl border-t-2 border-acts-border bg-acts-surface px-5 pb-2 pt-5"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-acts-border" />

          <View className="mb-4 flex-row items-center gap-4">
            <View
              className="items-center justify-center rounded-2xl border-2 p-4"
              style={{
                borderColor: `${def.accentHex}88`,
                backgroundColor: `${def.accentHex}22`,
              }}>
              <Ionicons name={def.icon} size={48} color={def.accentHex} />
            </View>
            <View className="flex-1">
              <AppText variant="subtitle" className="text-acts-ink">
                {def.title}
              </AppText>
              <View className="mt-1 flex-row flex-wrap items-center gap-2">
                <View
                  className="rounded-full px-2.5 py-0.5"
                  style={{
                    backgroundColor: unlocked ? '#15803D33' : 'rgba(120,120,130,0.25)',
                  }}>
                  <AppText variant="caption" className="font-semibold text-acts-ink">
                    {unlocked ? 'Unlocked' : 'Locked'}
                  </AppText>
                </View>
                <AppText variant="caption" className="text-acts-muted">
                  {progress}
                </AppText>
              </View>
            </View>
          </View>

          <AppText variant="body" className="mb-2 text-acts-ink">
            {def.description}
          </AppText>
          <AppText variant="caption" className="mb-6 leading-5 text-acts-muted">
            {how}
          </AppText>

          <AppButton title="Got it" variant="primary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AchievementsScreen() {
  const act = useActAppearance();
  const uid = useAuthStore((s) => s.user?.uid);
  const { width } = useWindowDimensions();
  const { data: tasks = [] } = useTasksQuery(uid);
  const { data: userInfo } = useUserInfoQuery(uid);
  const { data: myPosts = [] } = useMyDeedPostsQuery(uid);
  const [selected, setSelected] = useState<AchievementDef | null>(null);

  const acts = useMemo(() => mergeActsDefaults(userInfo?.ActsSettings), [userInfo?.ActsSettings]);
  const metrics: AchievementMetrics = useMemo(
    () => ({
      streakDays: computeCompletionStreak(tasks, acts),
      lifetimeXp: Math.max(0, Math.floor(Number(userInfo?.LifetimeXP ?? 0))),
      actsCompleted: tasks.filter((t) => t.completedAt != null).length,
      deedPostsAuthored: myPosts.length,
    }),
    [tasks, userInfo?.LifetimeXP, myPosts.length, acts],
  );

  const bySection = useMemo(() => {
    const map: Record<AchievementCategory, AchievementDef[]> = {
      streak: [],
      xp: [],
      acts: [],
      deed_feed: [],
    };
    for (const a of ACHIEVEMENTS) {
      map[a.category].push(a);
    }
    const sortKey = (d: AchievementDef): number => {
      const m = d.metric;
      const base =
        m.kind === 'streak_min'
          ? m.days
          : m.kind === 'xp_min'
            ? m.xp
            : m.kind === 'acts_min'
              ? m.n
              : m.n;
      return base;
    };
    for (const cat of ACHIEVEMENT_SECTION_ORDER) {
      map[cat].sort((a, b) => sortKey(a) - sortKey(b));
    }
    return map;
  }, []);

  const unlockedCount = useMemo(() => ACHIEVEMENTS.filter((a) => isAchievementUnlocked(a, metrics)).length, [metrics]);
  const progressPct = ACHIEVEMENTS.length > 0 ? unlockedCount / ACHIEVEMENTS.length : 0;

  return (
    <>
      <Stack.Screen
        options={{
          ...stackHeaderChrome(act),
          headerShown: true,
          title: 'Trophy hall',
          headerTitleStyle: { color: act.palette.ink, fontWeight: '800' },
          headerLeft: () => <HeaderBackLabel />,
        }}
      />
      <Screen scroll>
        <View className="pb-10 pt-1">
          <AppCard
            className="mb-5 overflow-hidden border-2 border-amber-500/35 p-0"
            cardBackgroundColor={`${act.palette.surface}`}>
            <View
              className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-30"
              style={{ backgroundColor: '#FBBF24' }}
            />
            <View
              className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full opacity-25"
              style={{ backgroundColor: '#A855F7' }}
            />
            <View className="relative p-5">
              <View className="mb-2 flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                  <View className="rounded-2xl bg-amber-500/25 p-2.5">
                    <Ionicons name="trophy" size={26} color="#D97706" />
                  </View>
                  <TitleWithInfo
                    title="Your trophy case"
                    variant="subtitle"
                    infoText="Tap any badge for the full quest briefing."
                  />
                </View>
                <View className="shrink-0 items-end pl-1">
                  <AppText variant="caption" className="mb-0.5 text-acts-muted">
                    Unlocked
                  </AppText>
                  <AppText className="text-2xl font-black text-acts-ink">
                    {unlockedCount}
                    <AppText className="text-lg font-bold text-acts-muted">{` / ${ACHIEVEMENTS.length}`}</AppText>
                  </AppText>
                </View>
              </View>

              <View className="mb-3 h-3 overflow-hidden rounded-full bg-acts-canvas">
                <View
                  className="h-3 rounded-full"
                  style={{
                    width: `${Math.round(progressPct * 100)}%`,
                    backgroundColor: '#F59E0B',
                    minWidth: progressPct > 0 ? 8 : 0,
                  }}
                />
              </View>
              <View className="mt-2 flex-row items-center gap-1">
                <Ionicons name="sparkles" size={14} color="#CA8A04" />
                <AppText variant="caption" className="text-acts-muted">
                  {unlockedCount === ACHIEVEMENTS.length
                    ? 'Collection complete — you legend!'
                    : `${ACHIEVEMENTS.length - unlockedCount} badge${ACHIEVEMENTS.length - unlockedCount === 1 ? '' : 's'} left to discover`}
                </AppText>
              </View>
            </View>
          </AppCard>

          {ACHIEVEMENT_SECTION_ORDER.map((section) => {
            const flavor = ACHIEVEMENT_SECTION_FLAVOR[section];
            const accent = SECTION_ACCENT[section];
            return (
              <AppCard
                key={section}
                className="mb-5 border-2 p-4"
                style={{ borderColor: `${accent}44` }}
                cardBackgroundColor={`${accent}0D`}>
                <View className="mb-4 flex-row items-start gap-3">
                  <View
                    className="rounded-2xl border p-2.5"
                    style={{
                      borderColor: `${accent}55`,
                      backgroundColor: `${accent}22`,
                    }}>
                    <Ionicons name={flavor.icon} size={22} color={accent} />
                  </View>
                  <View className="flex-1">
                    <AppText variant="subtitle" className="font-extrabold text-acts-ink">
                      {ACHIEVEMENT_SECTION_LABEL[section]}
                    </AppText>
                    <AppText variant="caption" className="mt-0.5 text-acts-muted">
                      {flavor.tagline}
                    </AppText>
                  </View>
                </View>

                <View className="flex-row flex-wrap px-0.5">
                  {bySection[section].map((def) => (
                    <BadgeTile
                      key={def.id}
                      def={def}
                      unlocked={isAchievementUnlocked(def, metrics)}
                      width={width}
                      onPress={() => setSelected(def)}
                    />
                  ))}
                </View>
              </AppCard>
            );
          })}
        </View>
      </Screen>

      <AchievementDetailModal
        def={selected}
        metrics={metrics}
        visible={selected != null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
