import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

function DeedFeedFriendsHeaderButton() {
  const router = useRouter();
  const act = useActAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Friends"
      hitSlop={8}
      onPress={() => router.push('/deed-feed/friends')}
      className="mr-3 h-11 w-11 items-center justify-center rounded-full border border-acts-border bg-acts-surface active:opacity-85">
      <Ionicons
        name="people"
        size={22}
        color={act.palette.ink}
        style={Platform.OS === 'android' ? { includeFontPadding: false } : undefined}
      />
    </Pressable>
  );
}

export default function DeedFeedLayout() {
  const act = useActAppearance();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: act.palette.ink,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: act.palette.canvas,
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Deed Feed',
          headerTitle: 'Deed Feed',
          headerRight: () => (
            <View className="items-center justify-center pr-3">
              <DeedFeedFriendsHeaderButton />
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="friends"
        options={{
          title: 'Friends',
          headerBackTitle: '',
        }}
      />
    </Stack>
  );
}
