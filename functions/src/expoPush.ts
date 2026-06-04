import { logger } from 'firebase-functions/v2';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
};

/** Expo-issued tokens look like `ExponentPushToken[...]` or `ExpoPushToken[...]`. */
export function isExpoPushToken(token: unknown): token is string {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Sends notifications through Expo's push service (handles APNs + FCM for us).
 * Best-effort: logs failures but never throws, so a bad token can't fail the trigger.
 */
export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  const valid = messages.filter((m) => isExpoPushToken(m.to));
  if (valid.length === 0) {
    return;
  }

  // Expo accepts up to 100 messages per request.
  for (const batch of chunk(valid, 100)) {
    try {
      const res = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          batch.map((m) => ({
            to: m.to,
            title: m.title,
            body: m.body,
            data: m.data ?? {},
            sound: m.sound === undefined ? 'default' : m.sound,
            badge: m.badge,
            priority: 'high',
          })),
        ),
      });

      if (!res.ok) {
        logger.warn('Expo push request failed', { status: res.status, text: await res.text() });
        continue;
      }

      const json = (await res.json()) as {
        data?: { status: string; message?: string; details?: unknown }[];
      };
      const errors = (json.data ?? []).filter((t) => t.status === 'error');
      if (errors.length > 0) {
        logger.warn('Expo push ticket errors', { errors });
      }
    } catch (err) {
      logger.error('Expo push send threw', { err });
    }
  }
}
