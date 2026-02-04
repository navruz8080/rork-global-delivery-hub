import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, MapPin, Clock, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import TrackingTimeline from '@/components/TrackingTimeline';

export default function TrackingScreen() {
  const router = useRouter();
  const [trackNumber, setTrackNumber] = useState('');

  const trackQuery = trpc.delivery.trackPackage.useQuery(
    { trackNumber },
    { enabled: false }
  );

  const handleSearch = () => {
    if (!trackNumber.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackQuery.refetch();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Track Package</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={Colors.light.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter track number"
              value={trackNumber}
              onChangeText={setTrackNumber}
              autoCapitalize="none"
              onSubmitEditing={handleSearch}
            />
          </View>
          <Pressable
            style={[
              styles.searchButton,
              (!trackNumber.trim() || trackQuery.isFetching) && styles.searchButtonDisabled,
            ]}
            onPress={handleSearch}
            disabled={!trackNumber.trim() || trackQuery.isFetching}
          >
            {trackQuery.isFetching ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Track</Text>
            )}
          </Pressable>
        </View>

        {/* Results */}
        {trackQuery.data && (
          <View style={styles.resultContainer}>
            <View style={styles.packageInfo}>
              <Text style={styles.trackNumber}>{trackQuery.data.trackNumber}</Text>
              {trackQuery.data.description && (
                <Text style={styles.description}>{trackQuery.data.description}</Text>
              )}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trackQuery.data.status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(trackQuery.data.status)}</Text>
              </View>
            </View>

            <TrackingTimeline events={trackQuery.data.history} />
          </View>
        )}

        {trackQuery.isError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Package not found. Please check the track number.
            </Text>
          </View>
        )}

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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 14,
  },
  searchButton: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  resultContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
  },
  packageInfo: {
    marginBottom: 24,
  },
  trackNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});
