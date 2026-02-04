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
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Package, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function PackagesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const packagesQuery = trpc.delivery.getMyPackages.useQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await packagesQuery.refetch();
    setRefreshing(false);
  }, [packagesQuery]);

  const handleAddPackage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/package/add');
  }, [router]);

  const packages = packagesQuery.data?.packages ?? [];

  const statusGroups = {
    active: packages.filter(p => !['ISSUED', 'CANCELED'].includes(p.status)),
    completed: packages.filter(p => p.status === 'ISSUED'),
    canceled: packages.filter(p => p.status === 'CANCELED'),
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>My Packages</Text>
          <Pressable onPress={handleAddPackage} style={styles.addButton}>
            <Plus size={24} color={Colors.light.secondary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {packagesQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.secondary} />
          </View>
        ) : packages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color={Colors.light.textSecondary} />
            <Text style={styles.emptyTitle}>No packages yet</Text>
            <Text style={styles.emptySubtitle}>
              Add a track number to start tracking your delivery
            </Text>
            <Pressable style={styles.emptyButton} onPress={handleAddPackage}>
              <Plus size={20} color="#FFF" />
              <Text style={styles.emptyButtonText}>Add Package</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {statusGroups.active.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active ({statusGroups.active.length})</Text>
                {statusGroups.active.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </View>
            )}

            {statusGroups.completed.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Completed ({statusGroups.completed.length})</Text>
                {statusGroups.completed.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </View>
            )}

            {statusGroups.canceled.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Canceled ({statusGroups.canceled.length})</Text>
                {statusGroups.canceled.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

function PackageCard({ pkg }: { pkg: any }) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.packageCard}
      onPress={() => router.push(`/package/${pkg.id}`)}
    >
      <View style={styles.packageHeader}>
        <View style={styles.packageInfo}>
          <Text style={styles.trackNumber}>{pkg.trackNumber}</Text>
          {pkg.description && (
            <Text style={styles.description} numberOfLines={1}>
              {pkg.description}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pkg.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(pkg.status)}</Text>
        </View>
      </View>
      <Text style={styles.date}>
        Updated {formatDate(pkg.updatedAt)}
      </Text>
    </Pressable>
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  packageCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  packageInfo: {
    flex: 1,
  },
  trackNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  date: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  bottomSpacing: {
    height: 20,
  },
});
