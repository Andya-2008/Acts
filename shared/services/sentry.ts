import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';

/**
 * Crash + error reporting via @sentry/react-native.
 *
 * Enabled only when `EXPO_PUBLIC_SENTRY_DSN` is set (EAS Production / Preview, or local `.env`).
 * Without a DSN this no-ops so local/dev builds stay quiet. We never send email/PII to Sentry -
 * only the Firebase uid and username for grouping.
 */

type CaptureLevel = 'fatal' | 'error' | 'warning' | 'info';

let initialized = false;

export function isSentryEnabled(): boolean {
  return initialized;
}

export function initializeSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) {
    if (__DEV__) {
      console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN not set - crash reporting disabled in dev.');
    }
    return;
  }
  if (initialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    // We attach the uid/username explicitly; don't auto-collect IP/PII.
    sendDefaultPii: false,
    enableNativeCrashHandling: true,
    // Errors are always captured; sample performance traces to control cost.
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
  initialized = true;
}

/** Wrap the root component so render errors and performance data are captured. */
export function wrapRootComponent<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  if (!initialized) {
    return Component;
  }
  return Sentry.wrap(
    Component as unknown as ComponentType<Record<string, unknown>>,
  ) as unknown as ComponentType<P>;
}

export function captureException(
  error: Error | string,
  context?: Record<string, unknown>,
  level: CaptureLevel = 'error',
): void {
  if (!initialized) {
    if (typeof error === 'string') {
      console.error(`[Sentry disabled] ${level}:`, error, context);
    } else {
      console.error('[Sentry disabled]', error, context);
    }
    return;
  }
  if (typeof error === 'string') {
    Sentry.captureMessage(error, { level, extra: context });
  } else {
    Sentry.captureException(error, { level, extra: context });
  }
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
): void {
  if (!initialized) {
    return;
  }
  Sentry.addBreadcrumb({ message, category, data, level });
}

export function setSentryUserContext(userId: string, _email?: string, username?: string): void {
  if (!initialized) {
    return;
  }
  // Deliberately omit email to avoid sending PII to Sentry.
  Sentry.setUser({ id: userId, username });
}

export function clearSentryUserContext(): void {
  if (!initialized) {
    return;
  }
  Sentry.setUser(null);
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;
