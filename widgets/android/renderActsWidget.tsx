import {
  FlexWidget,
  TextWidget,
  type WidgetRepresentation,
} from 'react-native-android-widget';

import type { WidgetSnapshot } from '@/shared/types/widgetSnapshot';
import { WIDGET_TASKS_DEEP_LINK } from '@/shared/types/widgetSnapshot';

const BRAND = '#FA5A88';
const INK = '#1A1A1A';
const INK_SECONDARY = '#374151';
const SURFACE = '#FFFFFF';
const GREEN = '#1F7A54';

function streakSubtitle(snapshot: WidgetSnapshot): string {
  if (snapshot.completedToday) {
    return 'Done for today';
  }
  if (snapshot.openTaskCount === 0) {
    return 'Add an act in Acts';
  }
  if (snapshot.openTaskCount === 1) {
    return '1 act waiting';
  }
  return `${snapshot.openTaskCount} acts waiting`;
}

function widgetRootStyle() {
  return {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 12,
  } as const;
}

export function renderAndroidStreakWidget(snapshot: WidgetSnapshot): WidgetRepresentation {
  return (
    <FlexWidget
      style={widgetRootStyle()}
      clickAction="OPEN_URI"
      clickActionData={{ uri: WIDGET_TASKS_DEEP_LINK }}
      accessibilityLabel="Acts streak">
      <TextWidget text="Acts" style={{ fontSize: 12, color: BRAND, fontWeight: '700' }} />
      <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
        <TextWidget
          text={String(snapshot.streak)}
          style={{ fontSize: 36, color: GREEN, fontWeight: '700' }}
        />
        <TextWidget
          text={snapshot.streak === 1 ? 'day streak' : 'day streak'}
          style={{ fontSize: 12, color: INK_SECONDARY, marginTop: 2 }}
        />
      </FlexWidget>
      <TextWidget text={streakSubtitle(snapshot)} style={{ fontSize: 11, color: INK_SECONDARY }} maxLines={2} />
    </FlexWidget>
  );
}

export function renderAndroidTasksWidget(snapshot: WidgetSnapshot): WidgetRepresentation {
  const tasks = snapshot.tasks.slice(0, 3);

  return (
    <FlexWidget
      style={widgetRootStyle()}
      clickAction="OPEN_URI"
      clickActionData={{ uri: WIDGET_TASKS_DEEP_LINK }}
      accessibilityLabel="Acts to do">
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget text="Acts" style={{ fontSize: 12, color: BRAND, fontWeight: '700' }} />
        <TextWidget
          text={`${snapshot.streak}d streak`}
          style={{ fontSize: 11, color: GREEN, fontWeight: '600' }}
        />
      </FlexWidget>

      {tasks.length === 0 ? (
        <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
          <TextWidget
            text={snapshot.completedToday ? 'All done today!' : 'Open Acts to see your list'}
            style={{ fontSize: 14, color: INK, fontWeight: '600' }}
            maxLines={2}
          />
        </FlexWidget>
      ) : (
        <FlexWidget style={{ flex: 1, marginTop: 8, flexGap: 6 }}>
          {tasks.map((task) => (
            <TextWidget
              key={task.id}
              text={`• ${task.title}`}
              style={{ fontSize: 13, color: INK }}
              maxLines={1}
            />
          ))}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

export const EMPTY_WIDGET_SNAPSHOT: WidgetSnapshot = {
  streak: 0,
  completedToday: false,
  openTaskCount: 0,
  tasks: [],
  updatedAt: new Date(0).toISOString(),
};
