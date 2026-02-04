import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, LogIn } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import OrderCard from '@/components/OrderCard';
import Button from '@/components/Button';
import { useApp } from '@/providers/AppProvider';
import { OrderStatus } from '@/types';

type FilterType = 'all' | 'active' | 'completed';

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery'];
const completedStatuses: OrderStatus[] = ['delivered', 'cancelled', 'returned'];

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, isAuthenticated, refetchOrders, isLoading } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchOrders();
    setRefreshing(false);
  }, [refetchOrders]);

  const filteredOrders = useMemo(() => {
    switch (activeFilter) {
      case 'active':
        return orders.filter(o => activeStatuses.includes(o.status));
      case 'completed':
        return orders.filter(o => completedStatuses.includes(o.status));
      default:
        return orders;
    }
  }, [orders, activeFilter]);

  const handleFilterPress = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>My Orders</Text>
          </View>
        </SafeAreaView>
        <View style={styles.authContainer}>
          <View style={styles.authIcon}>
            <LogIn size={48} color={Colors.light.textTertiary} />
          </View>
          <Text style={styles.authTitle}>Sign in to view orders</Text>
          <Text style={styles.authSubtitle}>
            Track your orders and view order history
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.authButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.orderCount}>{orders.length} total</Text>
        </View>

        <View style={styles.filtersContainer}>
          {filters.map(filter => (
            <Pressable
              key={filter.value}
              style={[
                styles.filterButton,
                activeFilter === filter.value && styles.filterButtonActive,
              ]}
              onPress={() => handleFilterPress(filter.value)}
            >
              <Text style={[
                styles.filterText,
                activeFilter === filter.value && styles.filterTextActive,
              ]}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      {isLoading && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.secondary} />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Package size={48} color={Colors.light.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'active' 
                  ? "You don't have any active orders" 
                  : activeFilter === 'completed'
                  ? "You don't have any completed orders"
                  : "You haven't placed any orders yet"}
              </Text>
              <Button
                title="Start Shopping"
                onPress={() => router.push('/catalog')}
                style={styles.shopButton}
              />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  safeArea: {
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  orderCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    minWidth: 160,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  authIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  authButton: {
    minWidth: 160,
  },
});
