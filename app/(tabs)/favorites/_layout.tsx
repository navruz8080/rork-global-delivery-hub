import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function FavoritesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.surface },
        headerTintColor: Colors.light.text,
        headerShadowVisible: false,
        headerShown: false,
      }}
    />
  );
}
