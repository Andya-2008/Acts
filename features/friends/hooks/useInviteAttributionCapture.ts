import * as Linking from 'expo-linking';
import { useEffect } from 'react';

import { captureInviteAttributionFromUrl } from '@/features/friends/inviteAttribution';

/** Persists inviter uid from cold-start / foreground deep links before sign-up. */
export function useInviteAttributionCapture(): void {
  useEffect(() => {
    const handle = (url: string) => {
      void captureInviteAttributionFromUrl(url);
    };

    void Linking.getInitialURL().then((url) => {
      if (url) {
        handle(url);
      }
    });

    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);
}
