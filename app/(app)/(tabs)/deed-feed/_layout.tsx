import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { actsTheme } from '@/shared/theme/actsTheme';

const headerCanvas = '#FFF7FB';
const headerInk = '#2D1528';

const styles = StyleSheet.create({
  headerWrap: {
    paddingRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: actsTheme.colors.surface,
    borderWidth: 1,
    borderColor: actsTheme.colors.border,
  },
});

function DeedFeedFriendsHeaderButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Friends"
      hitSlop={8}
      onPress={() => router.push('/deed-feed/friends')}
      style={({ pressed }) => [styles.circleButton, pressed && { opacity: 0.85 }]}>
      <Ionicons
        name="people"
        size={22}
        color={headerInk}
        style={Platform.OS === 'android' ? { includeFontPadding: false } : undefined}
      />
    </Pressable>
  );
}

export default function DeedFeedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: headerInk,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: headerCanvas,
        },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Deed Feed',
          headerTitle: 'Deed Feed',
          headerRight: () => (
            <View style={styles.headerWrap}>
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
