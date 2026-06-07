import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useReduceMotion } from '@/shared/hooks/useReduceMotion';
import { modalAnimationType } from '@/shared/utils/accessibilityMotion';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';

import { AppButton, AppText } from '@/shared/components/ui';
import { readableChipColors, readableTextColors } from '@/shared/theme/colorUtils';
import type { ActTask, TaskCadence } from '@/shared/types/task';
import type { TaskCheckThemeId } from '@/features/cosmetics/taskCheckThemes';
import { TASK_CHECK_THEMES } from '@/features/cosmetics/taskCheckThemes';

import type { TaskRewardCardRect } from './TaskRewardFly';

export type TaskToggleOrigin = { card: TaskRewardCardRect };

function cadenceLabel(c: TaskCadence): string {
  switch (c) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    default:
      return 'Anytime';
  }
}

function difficultyLabel(level: ActTask['difficulty']): string {
  if (level === 1) {
    return 'Easy';
  }
  if (level === 3) {
    return 'Hard';
  }
  return 'Medium';
}

function categoryDisplayName(category: string): string {
  const t = category.trim();
  if (!t) {
    return 'General';
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function TagChip({
  children,
  className,
  borderColor,
  backgroundColor,
  textColor,
}: {
  children: string;
  className?: string;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
}) {
  return (
    <View
      className={`self-start rounded-full border px-2.5 py-1 ${className ?? 'border-acts-border/80 bg-acts-surface'}`}
      style={
        borderColor || backgroundColor
          ? { borderColor, backgroundColor }
          : undefined
      }>
      <AppText
        variant="caption"
        className={textColor ? 'font-medium' : 'font-medium text-acts-ink'}
        style={textColor ? { color: textColor } : undefined}>
        {children}
      </AppText>
    </View>
  );
}

type IonName = ComponentProps<typeof Ionicons>['name'];

function IconAction({
  name,
  label,
  onPress,
  disabled,
  loading,
  variant,
}: {
  name: IonName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant: 'surface' | 'rose' | 'blue' | 'danger';
}) {
  const ring =
    variant === 'rose'
      ? 'border-acts-green/40 bg-acts-surface'
      : variant === 'blue'
        ? 'border-acts-blue/35 bg-acts-blue-soft/80'
        : variant === 'danger'
          ? 'border-acts-border bg-acts-canvas'
          : 'border-acts-border bg-acts-surface';
  const iconColor =
    variant === 'rose' ? '#E11D74' : variant === 'blue' ? '#5B6BE8' : variant === 'danger' ? '#B91C1C' : '#2D1528';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-full border ${ring} active:opacity-80 ${
        disabled || loading ? 'opacity-45' : ''
      }`}>
      {loading ? <ActivityIndicator size="small" color={iconColor} /> : <Ionicons name={name} size={22} color={iconColor} />}
    </Pressable>
  );
}

type TaskRowProps = {
  task: ActTask;
  onToggleComplete: (origin?: TaskToggleOrigin) => void;
  busy?: boolean;
  /** While reward flight runs, hide the real row (ghost is drawn in the overlay). */
  hideForRewardFly?: boolean;
  /** Shown only after the act is marked done - direct actions, no system alerts. */
  onPickTaskPhotoFromLibrary?: (task: ActTask) => void;
  onPickTaskPhotoFromCamera?: (task: ActTask) => void;
  onRemoveTaskPhoto?: (task: ActTask) => void;
  /** When saving or clearing a photo, which task row shows a spinner. */
  photoActionTaskId?: string | null;
  /** Share this act's memory photo to the community deed feed (mobile). */
  onShareToDeedFeed?: (task: ActTask) => void;
  deedFeedShareTaskId?: string | null;
  /** Checkbox chrome from shop / ActsSettings (`default` when omitted). */
  taskCheckThemeId?: TaskCheckThemeId;
  /** Show an exciting "New" marker for acts the user hasn't seen on this tab yet. */
  isNew?: boolean;
  /** First-act onboarding highlight ring. */
  spotlight?: boolean;
};

export function TaskRow({
  task,
  onToggleComplete,
  busy,
  hideForRewardFly,
  onPickTaskPhotoFromLibrary,
  onPickTaskPhotoFromCamera,
  onRemoveTaskPhoto,
  photoActionTaskId,
  onShareToDeedFeed,
  deedFeedShareTaskId,
  taskCheckThemeId = 'default',
  isNew = false,
  spotlight = false,
}: TaskRowProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const cardMeasureRef = useRef<View>(null);
  const reduceMotion = useReduceMotion();
  const checkScale = useRef(new Animated.Value(1)).current;
  const prevDone = useRef(task.completedAt != null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const done = task.completedAt != null;
  const hasLongText = Boolean(task.textLong?.trim());
  const photoBusyThis = photoActionTaskId === task.id;
  const deedFeedBusyThis = deedFeedShareTaskId === task.id;
  const showMemoryActions =
    done && Boolean(onPickTaskPhotoFromLibrary && onPickTaskPhotoFromCamera);
  const theme = TASK_CHECK_THEMES[taskCheckThemeId] ?? TASK_CHECK_THEMES.default;
  const themedRow =
    theme.cardBorder != null &&
    theme.cardBg != null &&
    theme.cardBorderDone != null &&
    theme.cardBgDone != null;
  // On cosmetic themed cards the fill is a fixed color, so derive legible text
  // colors from that fill instead of the app palette (which may be dark/light).
  const themedCardBgHex = themedRow ? (done ? theme.cardBgDoneHex : theme.cardBgHex) : undefined;
  const themedText = themedCardBgHex ? readableTextColors(themedCardBgHex) : null;
  const themedChips = themedCardBgHex ? readableChipColors(themedCardBgHex) : null;
  const titleColor = themedText ? (done ? themedText.secondary : themedText.primary) : undefined;

  useEffect(() => {
    const wasDone = prevDone.current;
    prevDone.current = done;
    if (!wasDone && done) {
      if (reduceMotion) {
        checkScale.setValue(1);
      } else {
        checkScale.setValue(0.86);
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [done, checkScale, reduceMotion]);

  const body = (
    <>
      {isNew && !done ? (
        <View className="mb-1.5 flex-row items-center self-start rounded-full bg-acts-green px-2.5 py-1">
          <Ionicons name="sparkles" size={12} color="#FFFFFF" />
          <AppText variant="caption" className="ml-1 text-xs font-bold text-white">
            New
          </AppText>
        </View>
      ) : null}
      <View className="mb-1">
        {hasLongText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${task.textShort}. Tap for more info.`}
            accessibilityState={{ expanded: detailsOpen }}
            disabled={busy}
            onPress={() => setDetailsOpen((v) => !v)}
            className="flex-row items-start gap-2 active:opacity-90">
            <AppText
              variant="subtitle"
              paletteColor={!themedText}
              style={titleColor ? { color: titleColor } : undefined}
              className={`min-w-0 flex-1 shrink ${done ? 'line-through' : ''} ${
                themedText ? '' : done ? 'text-acts-muted' : 'text-acts-ink'
              }`}>
              {task.textShort}
            </AppText>
            <Ionicons
              name={detailsOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={themedText ? themedText.secondary : '#8B6F82'}
              accessibilityLabel={detailsOpen ? 'Hide details' : 'Show details'}
            />
          </Pressable>
        ) : (
          <AppText
            variant="subtitle"
            paletteColor={!themedText}
            style={titleColor ? { color: titleColor } : undefined}
            className={`min-w-0 shrink ${done ? 'line-through' : ''} ${
              themedText ? '' : done ? 'text-acts-muted' : 'text-acts-ink'
            }`}>
            {task.textShort}
          </AppText>
        )}
        <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
          {done ? (
            <TagChip
              className={themedChips ? 'border' : 'border border-acts-green/35 bg-acts-surface'}
              borderColor={themedChips?.border}
              backgroundColor={themedChips?.background}
              textColor={themedChips?.text}>
              {task.photoUrl ? 'Memory photo saved' : 'No memory photo yet'}
            </TagChip>
          ) : null}
          {done && task.deedFeedPostId ? (
            <TagChip
              className={themedChips ? 'border' : 'border border-acts-blue/35 bg-acts-blue-soft/90'}
              borderColor={themedChips?.border}
              backgroundColor={themedChips?.background}
              textColor={themedChips?.text}>
              On deed feed
            </TagChip>
          ) : null}
          {task.picture ? (
            <TagChip
              className={themedChips ? 'border' : 'border border-acts-border/80 bg-acts-surface/90'}
              borderColor={themedChips?.border}
              backgroundColor={themedChips?.background}
              textColor={themedChips?.text}>
              Photo suggested
            </TagChip>
          ) : null}
        </View>
      </View>

      {detailsOpen && hasLongText ? (
        <AppText
          variant="body"
          paletteColor={!themedText}
          style={themedText ? { color: themedText.primary } : undefined}
          className={`mb-3 leading-6 ${themedText ? '' : 'text-acts-ink'}`}>
          {task.textLong}
        </AppText>
      ) : null}

      <View className="mb-2 flex-row flex-wrap items-center gap-2">
        <TagChip
          className={themedChips ? 'border' : 'border border-acts-blue/25 bg-acts-blue-soft/90'}
          borderColor={themedChips?.border}
          backgroundColor={themedChips?.background}
          textColor={themedChips?.text}>
          {cadenceLabel(task.cadence)}
        </TagChip>
        <TagChip
          className={
            themedChips
              ? 'border'
              : task.difficulty === 1
                ? 'border border-acts-green/30 bg-acts-green-soft/90'
                : task.difficulty === 3
                  ? 'border border-acts-border/80 bg-acts-canvas'
                  : 'border border-acts-border/80 bg-acts-surface'
          }
          borderColor={themedChips?.border}
          backgroundColor={themedChips?.background}
          textColor={themedChips?.text}>
          {difficultyLabel(task.difficulty)}
        </TagChip>
        <TagChip
          className={themedChips ? 'border' : 'border border-acts-border/80 bg-acts-surface/90'}
          borderColor={themedChips?.border}
          backgroundColor={themedChips?.background}
          textColor={themedChips?.text}>
          {categoryDisplayName(task.category)}
        </TagChip>
      </View>

      {task.materials.length > 0 && !(task.materials.length === 1 && task.materials[0] === 'Nothing') ? (
        <View className="mb-2 flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <AppText
            variant="caption"
            className={themedText ? 'font-semibold' : 'font-semibold text-acts-muted'}
            style={themedText ? { color: themedText.secondary } : undefined}>
            Materials
          </AppText>
          {task.materials.map((m) => (
            <View
              key={m}
              className={themedChips ? 'rounded-full border px-2.5 py-1' : 'rounded-full border border-acts-border bg-acts-surface px-2.5 py-1'}
              style={
                themedChips
                  ? { borderColor: themedChips.border, backgroundColor: themedChips.background }
                  : undefined
              }>
              <AppText
                variant="caption"
                className={themedChips ? '' : 'text-acts-muted'}
                style={themedChips ? { color: themedChips.text } : undefined}>
                {m}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {done && !task.photoUrl && showMemoryActions ? (
        <View className="mb-3 h-28 w-28 items-center justify-center self-start rounded-2xl border-2 border-dashed border-acts-border/80 bg-acts-surface/70">
          <Ionicons name="image-outline" size={42} color="#C4B5BD" accessibilityIgnoresInvertColors />
        </View>
      ) : null}

      {task.photoUrl ? (
        <View className={`mb-2 flex-row items-start gap-3 ${done ? 'items-center' : 'items-start'}`}>
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel="View task photo full screen"
            onPress={() => setPhotoPreviewOpen(true)}
            className={
              done
                ? 'overflow-hidden rounded-2xl border-2 border-white shadow-md'
                : 'overflow-hidden rounded-2xl border border-acts-border'
            }>
            <Image
              source={{ uri: task.photoUrl }}
              className={done ? 'h-28 w-28' : 'h-16 w-16'}
              resizeMode="cover"
            />
          </Pressable>
          {done ? (
            <View className="flex-row flex-wrap items-center gap-2">
              <IconAction
                name="expand-outline"
                label="View photo full screen"
                variant="surface"
                disabled={busy}
                onPress={() => setPhotoPreviewOpen(true)}
              />
              {onRemoveTaskPhoto ? (
                <IconAction
                  name="trash-outline"
                  label="Remove photo"
                  variant="danger"
                  disabled={busy || photoBusyThis}
                  onPress={() => onRemoveTaskPhoto(task)}
                />
              ) : null}
              {onShareToDeedFeed && !task.deedFeedPostId ? (
                <IconAction
                  name="paper-plane-outline"
                  label="Share to deed feed"
                  variant="blue"
                  disabled={busy || photoBusyThis}
                  loading={deedFeedBusyThis}
                  onPress={() => onShareToDeedFeed(task)}
                />
              ) : null}
            </View>
          ) : (
            <View className="min-w-0 flex-1 gap-1">
              <AppText variant="caption" className="text-acts-muted">
                Your picture for this act
              </AppText>
              <View className="flex-row flex-wrap gap-2">
                <AppButton
                  title="View"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => setPhotoPreviewOpen(true)}
                />
                {onRemoveTaskPhoto ? (
                  <AppButton
                    title="Remove"
                    variant="ghost"
                    disabled={busy || photoBusyThis}
                    onPress={() => onRemoveTaskPhoto(task)}
                  />
                ) : null}
              </View>
              {onShareToDeedFeed && !task.deedFeedPostId ? (
                <View>
                  <AppButton
                    title="Share to deed feed"
                    variant="secondary"
                    className="mt-2 self-start"
                    disabled={busy || photoBusyThis || deedFeedBusyThis}
                    loading={deedFeedBusyThis}
                    onPress={() => onShareToDeedFeed(task)}
                  />
                </View>
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      {showMemoryActions ? (
        <View className={`mt-2 ${done ? 'items-center' : ''}`}>
          {!done ? (
            <AppText variant="caption" className="mb-2 text-acts-muted">
              {task.photoUrl ? 'Replace memory' : 'Optional memory photo'}
            </AppText>
          ) : null}
          <View className={`flex-row flex-wrap ${done ? 'justify-center gap-5' : 'gap-2'}`}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose photo from library"
              disabled={busy || photoBusyThis}
              onPress={() => onPickTaskPhotoFromLibrary?.(task)}
              className={`items-center justify-center rounded-full border-2 border-acts-blue/35 bg-acts-surface shadow-sm active:opacity-85 ${
                done ? 'h-16 w-16' : 'min-h-[52px] min-w-[48%] flex-1 flex-row gap-2 rounded-2xl border border-acts-border bg-acts-surface px-3 py-3'
              } ${busy || photoBusyThis ? 'opacity-50' : ''}`}>
              <Ionicons name={done ? 'images' : 'images-outline'} size={done ? 30 : 22} color="#5B6BE8" />
              {!done ? (
                <AppText variant="subtitle" className="text-acts-blue">
                  Library
                </AppText>
              ) : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take a photo with camera"
              disabled={busy || photoBusyThis}
              onPress={() => onPickTaskPhotoFromCamera?.(task)}
              className={`items-center justify-center rounded-full border-2 border-acts-green/40 bg-acts-surface shadow-sm active:opacity-85 ${
                done ? 'h-16 w-16' : 'min-h-[52px] min-w-[48%] flex-1 flex-row gap-2 rounded-2xl border border-acts-border bg-acts-surface px-3 py-3'
              } ${busy || photoBusyThis ? 'opacity-50' : ''}`}>
              <Ionicons name={done ? 'camera' : 'camera-outline'} size={done ? 28 : 22} color="#E11D74" />
              {!done ? (
                <AppText variant="subtitle" className="text-acts-green">
                  Camera
                </AppText>
              ) : null}
            </Pressable>
          </View>
          {photoBusyThis ? (
            <AppText variant="caption" className={`mt-2 text-center text-acts-muted ${done ? 'w-full' : ''}`}>
              Saving…
            </AppText>
          ) : null}
        </View>
      ) : null}
    </>
  );

  return (
    <View
      ref={cardMeasureRef}
      collapsable={false}
      className={`mb-3 flex-row items-start rounded-3xl px-4 py-3.5 ${
        spotlight && !done
          ? 'border-2 border-acts-green bg-acts-green-soft/90'
          : themedRow
            ? `border-2 ${done ? `${theme.cardBorderDone} ${theme.cardBgDone}` : `${theme.cardBorder} ${theme.cardBg}`}`
            : `border ${done ? 'border-acts-green/40 bg-acts-green-soft' : 'border-acts-border/70 bg-acts-surface'}`
      } ${busy ? 'opacity-60' : ''} ${hideForRewardFly ? 'opacity-0' : ''}`}
      pointerEvents={hideForRewardFly ? 'none' : 'auto'}>
      <View collapsable={false} className="mr-3">
        <View
          className={`rounded-full border-2 p-0.5 ${done ? `${theme.ringBorderDone} ${theme.ringBgDone}` : `${theme.ringBorder} ${theme.ringBg}`}`}>
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={done ? 'Mark as not done' : 'Mark as done'}
              disabled={busy}
              onPress={() => {
                const node = cardMeasureRef.current;
                if (node) {
                  node.measureInWindow((x, y, w, h) => {
                    onToggleComplete({ card: { x, y, width: w, height: h } });
                  });
                } else {
                  onToggleComplete();
                }
              }}
              hitSlop={12}
              className="items-center justify-center rounded-full">
              <Ionicons
                name={done ? theme.doneIcon : theme.emptyIcon}
                size={26}
                color={done ? theme.doneColor : theme.emptyColor}
              />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <View className="min-w-0 flex-1">{body}</View>

      <Modal
        visible={photoPreviewOpen}
        transparent
        animationType={modalAnimationType(reduceMotion, 'fade')}
        onRequestClose={() => setPhotoPreviewOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          className="flex-1 justify-center bg-black/88 px-4"
          onPress={() => setPhotoPreviewOpen(false)}>
          {task.photoUrl ? (
            <View className="items-center">
              <Image
                source={{ uri: task.photoUrl }}
                style={{
                  width: Math.min(windowWidth - 32, 720),
                  height: Math.min(windowHeight * 0.62, 520),
                }}
                resizeMode="contain"
              />
              <AppText variant="caption" className="mt-4 text-center text-white/90">
                Tap anywhere to close
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}
