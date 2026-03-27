import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Colors from '@/constants/colors';
import { AppProvider } from '@/providers/AppProvider';
import { trpc, trpcClient } from '@/lib/trpc';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.surface },
        headerTintColor: Colors.light.text,
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="product/[id]" 
        options={{ 
          title: 'Product',
          headerTransparent: true,
          headerTintColor: Colors.light.text,
        }} 
      />
      <Stack.Screen 
        name="order/[id]" 
        options={{ 
          title: 'Order Details',
        }} 
      />
      <Stack.Screen 
        name="checkout" 
        options={{ 
          title: 'Checkout',
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifications',
        }} 
      />
      <Stack.Screen 
        name="seller/[id]" 
        options={{ 
          title: '',
          headerTransparent: true,
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
        }} 
      />
      <Stack.Screen 
        name="addresses" 
        options={{ 
          title: 'Delivery Addresses',
        }} 
      />
      <Stack.Screen 
        name="payment-methods" 
        options={{ 
          title: 'Payment Methods',
        }} 
      />
      <Stack.Screen 
        name="help" 
        options={{ 
          title: 'Help Center',
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppProvider>
            <StatusBar style="dark" />
            <RootLayoutNav />
          </AppProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
