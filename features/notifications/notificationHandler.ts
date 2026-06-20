import * as Notifications from 'expo-notifications';

let handlerInstalled = false;

/** Show banners/sounds for remote and local notifications while the app is open. */
export function ensureNotificationHandler(): void {
  if (handlerInstalled) {
    return;
  }
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
