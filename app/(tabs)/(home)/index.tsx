import React, { useState, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calculator, Package, MapPin, Bell, ArrowRight, Truck, Box, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { trpc } from '@/lib/trpc';

export default function DeliveryHomeScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const packagesQuery = trpc.delivery.getMyPackages.useQuery();
  const ordersQuery = trpc.delivery.getMyOrders.useQuery();
  const recentActivityQuery = trpc.delivery.getRecentActivity.useQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      packagesQuery.refetch(),
      ordersQuery.refetch(),
      recentActivityQuery.refetch(),
    ]);
    setRefreshing(false);
  }, [packagesQuery, ordersQuery, recentActivityQuery]);

  const handleNotifications = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/notifications');
  }, [router]);

  const handleCalculate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/calculator');
  }, [router]);

  const handlePackages = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/packages');
  }, [router]);

  const handleTracking = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/tracking');
  }, [router]);

  const handleMarketplace = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/marketplace');
  }, [router]);

  const packages = packagesQuery.data?.packages ?? [];
  const orders = ordersQuery.data?.orders ?? [];
  const recentActivity = recentActivityQuery.data ?? [];

  const activePackages = packages.filter(p => 
    !['ISSUED', 'CANCELED'].includes(p.status)
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {user?.firstName || 'Guest'} 👋</Text>
            <Text style={styles.subtitle}>Your delivery hub</Text>
          </View>
          <Pressable style={styles.notificationButton} onPress={handleNotifications}>
            <Bell size={22} color={Colors.light.text} />
            {recentActivity.length > 0 && <View style={styles.notificationBadge} />}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={handleCalculate}>
            <LinearGradient
              colors={[Colors.light.secondary, Colors.light.gradientEnd]}
              style={styles.quickActionGradient}
            >
              <Calculator size={24} color="#FFF" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Calculate</Text>
            <Text style={styles.quickActionSubtext}>Delivery cost</Text>
          </Pressable>

          <Pressable style={styles.quickAction} onPress={handlePackages}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Package size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionText}>My Packages</Text>
            <Text style={styles.quickActionSubtext}>{activePackages.length} active</Text>
          </Pressable>

          <Pressable style={styles.quickAction} onPress={handleTracking}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
              <MapPin size={24} color="#10B981" />
            </View>
            <Text style={styles.quickActionText}>Track</Text>
            <Text style={styles.quickActionSubtext}>Shipments</Text>
          </Pressable>
        </View>

        {/* Active Packages */}
        {activePackages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Packages</Text>
              <Pressable onPress={handlePackages}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            {activePackages.slice(0, 3).map((pkg) => (
              <Pressable
                key={pkg.id}
                style={styles.packageCard}
                onPress={() => router.push(`/package/${pkg.id}`)}
              >
                <View style={styles.packageInfo}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageTrack}>{pkg.trackNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pkg.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(pkg.status)}</Text>
                    </View>
                  </View>
                  {pkg.description && (
                    <Text style={styles.packageDescription} numberOfLines={1}>
                      {pkg.description}
                    </Text>
                  )}
                  <Text style={styles.packageDate}>
                    Updated {formatDate(pkg.updatedAt)}
                  </Text>
                </View>
                <ArrowRight size={20} color={Colors.light.textSecondary} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Recent Orders */}
        {orders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <Pressable onPress={() => router.push('/orders')}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            {orders.slice(0, 2).map((order) => (
              <Pressable
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/order/${order.id}`)}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderRoute}>{order.route}</Text>
                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetail}>
                      <Box size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.orderDetailText}>
                        {order.totalWeight} kg / {order.totalVolume} m³
                      </Text>
                    </View>
                    <View style={styles.orderDetail}>
                      <Clock size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.orderDetailText}>
                        {formatDate(order.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.orderPrice}>
                  <Text style={styles.orderPriceText}>${order.price.toFixed(2)}</Text>
                  <Text style={styles.orderStatus}>{getOrderStatusLabel(order.status)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Marketplace Link */}
        <Pressable style={styles.marketplaceCard} onPress={handleMarketplace}>
          <LinearGradient
            colors={['#F3F4F6', '#E5E7EB']}
            style={styles.marketplaceGradient}
          >
            <View style={styles.marketplaceContent}>
              <View>
                <Text style={styles.marketplaceTitle}>Browse Marketplace</Text>
                <Text style={styles.marketplaceSubtitle}>Find products to deliver</Text>
              </View>
              <ArrowRight size={24} color={Colors.light.text} />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AWAITING_IU: '#FEF3C7',
    IU_STOCK: '#DBEAFE',
    IN_TRANSIT: '#E0E7FF',
    AT_PVZ: '#D1FAE5',
    READY_FOR_PICKUP: '#D1FAE5',
    ISSUED: '#D1FAE5',
    CANCELED: '#FEE2E2',
  };
  return colors[status] || '#F3F4F6';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AWAITING_IU: 'Awaiting IU',
    IU_STOCK: 'At IU Warehouse',
    IN_TRANSIT: 'In Transit',
    AT_PVZ: 'At PVZ',
    READY_FOR_PICKUP: 'Ready',
    ISSUED: 'Delivered',
    CANCELED: 'Canceled',
  };
  return labels[status] || status;
}

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
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
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.secondary,
    borderWidth: 2,
    borderColor: Colors.light.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  quickActionSubtext: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  packageInfo: {
    flex: 1,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  packageTrack: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
  },
  packageDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  packageDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderRoute: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  orderDetails: {
    gap: 6,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDetailText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  orderPrice: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orderPriceText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  marketplaceCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  marketplaceGradient: {
    padding: 20,
  },
  marketplaceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketplaceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  marketplaceSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  bottomSpacing: {
    height: 20,
  },
});
