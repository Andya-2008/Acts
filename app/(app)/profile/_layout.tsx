import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: '#2D1528',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#FFF7FB' },
        headerBackTitle: '',
        title: 'Profile',
      }}
    />
  );
}
