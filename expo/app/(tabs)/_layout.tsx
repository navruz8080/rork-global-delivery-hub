import { Tabs } from 'expo-router';
import { Home, Calculator, Package, MapPin, User, Store } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';

function PackagesTabIcon({ color }: { color: string }) {
  const { unreadNotifications } = useApp();
  
  return (
    <View>
      <Package size={24} color={color} />
      {unreadNotifications > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.secondary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.light.borderLight,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Delivery',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: 'Calculate',
          tabBarIcon: ({ color }) => <Calculator size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="packages"
        options={{
          title: 'Packages',
          tabBarIcon: ({ color }) => <PackagesTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Tracking',
          tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color }) => <Store size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      {/* Hide old marketplace tabs */}
      <Tabs.Screen
        name="catalog"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colors.light.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
