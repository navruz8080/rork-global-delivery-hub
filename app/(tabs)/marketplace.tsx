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
import { ArrowLeft, Search, Store } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import { useApp } from '@/providers/AppProvider';
import { trpc } from '@/lib/trpc';

export default function MarketplaceScreen() {
  const router = useRouter();
  const { categories } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const featuredQuery = trpc.products.featured.useQuery();
  const dealsQuery = trpc.products.deals.useQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([featuredQuery.refetch(), dealsQuery.refetch()]);
    setRefreshing(false);
  }, [featuredQuery, dealsQuery]);

  const handleSearch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
  }, [router, searchQuery]);

  const featuredProducts = featuredQuery.data ?? [];
  const dealsProducts = dealsQuery.data ?? [];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Store size={20} color={Colors.light.text} />
            <Text style={styles.headerTitle}>Marketplace</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            onFilterPress={() => router.push('/catalog')}
            placeholder="Search products..."
          />
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
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            💡 Browse products from our marketplace. After purchase, you can add them to your delivery order.
          </Text>
        </View>

        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.slice(0, 6).map((category) => (
                <View key={category.id} style={styles.categoryItem}>
                  <CategoryCard category={category} size="small" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Hot Deals</Text>
          {dealsQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.secondary} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {dealsProducts.map((product) => (
                <View key={product.id} style={styles.productItem}>
                  <ProductCard product={product} />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          {featuredQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.secondary} />
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
          )}
        </View>

        <Pressable
          style={styles.viewAllButton}
          onPress={() => router.push('/catalog')}
        >
          <Text style={styles.viewAllText}>View All Products →</Text>
        </Pressable>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  infoBanner: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryItem: {
    marginRight: 12,
  },
  productsScroll: {
    paddingHorizontal: 20,
  },
  productItem: {
    marginRight: 12,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  bottomSpacing: {
    height: 20,
  },
});
