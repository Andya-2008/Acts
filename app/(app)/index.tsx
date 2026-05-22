import { Redirect, router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { signOutCurrentUser } from '@/features/auth/services/authService';
import { useFriendsGate } from '@/features/friends/hooks/useFriendsGate';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import { userInfoQueryKeys } from '@/features/user-profile/queryKeys';
import { AppText, Screen } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/authStore';

const PROFILE_READ_RETRIES = 18;
const PROFILE_READ_DELAY_MS = 200;

export default function AppEntryScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const { data, isError, refetch } = useUserInfoQuery(user?.uid);
  const friendsGate = useFriendsGate(user?.uid);
  const missingProfileHandled = useRef(false);
  const profileCheckRun = useRef(0);

  useEffect(() => {
    missingProfileHandled.current = false;
  }, [user?.uid]);

  useEffect(() => {
    if (!authReady || !user) {
      return;
    }
    if (data != null) {
      return;
    }
    if (missingProfileHandled.current) {
      return;
    }

    const checkId = ++profileCheckRun.current;

    if (isError) {
      missingProfileHandled.current = true;
      void (async () => {
        queryClient.removeQueries({ queryKey: userInfoQueryKeys.all });
        useAuthStore.getState().setLoginFlash('profile_missing');
        await signOutCurrentUser();
        router.replace('/(auth)/login');
      })();
      return;
    }

    let cancelled = false;
    void (async () => {
      for (let attempt = 0; attempt < PROFILE_READ_RETRIES; attempt++) {
        if (cancelled || checkId !== profileCheckRun.current) {
          return;
        }
        const result = await refetch();
        if (result.data != null) {
          return;
        }
        await new Promise((r) => setTimeout(r, PROFILE_READ_DELAY_MS));
      }
      if (cancelled || checkId !== profileCheckRun.current) {
        return;
      }
      if (missingProfileHandled.current) {
        return;
      }
      missingProfileHandled.current = true;
      queryClient.removeQueries({ queryKey: userInfoQueryKeys.all });
      useAuthStore.getState().setLoginFlash('profile_missing');
      await signOutCurrentUser();
      router.replace('/(auth)/login');
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, user, data, isError, refetch, queryClient]);

  if (!authReady) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <ActivityIndicator size="large" color="#3D8B6E" />
          <AppText variant="caption" className="text-center text-acts-muted">
            Restoring your session…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (!user) {
    return null;
  }

  if (data == null) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <ActivityIndicator size="large" color="#3D8B6E" />
          <AppText variant="caption" className="text-center text-acts-muted">
            Loading your profile…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (data.UserConfig === false) {
    return <Redirect href={'/(app)/personalization-choice' as Href} />;
  }

  if (!friendsGate.ready) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <ActivityIndicator size="large" color="#3D8B6E" />
          <AppText variant="caption" className="text-center text-acts-muted">
            Loading…
          </AppText>
        </View>
      </Screen>
    );
  }

  if (friendsGate.required) {
    return <Redirect href={'/(app)/friends-get-started' as Href} />;
  }

  return <Redirect href="/(app)/(tabs)/tasks" />;
}
