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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Flame, Zap, Gift } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import { useApp } from '@/providers/AppProvider';
import { trpc } from '@/lib/trpc';

export default function HomeScreen() {
  const router = useRouter();
  const { user, categories } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const featuredQuery = trpc.products.featured.useQuery();
  const dealsQuery = trpc.products.deals.useQuery();

  const isLoading = featuredQuery.isLoading || dealsQuery.isLoading;
  const isRefetching = featuredQuery.isRefetching || dealsQuery.isRefetching;

  const onRefresh = useCallback(() => {
    featuredQuery.refetch();
    dealsQuery.refetch();
  }, [featuredQuery, dealsQuery]);

  const handleNotifications = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/notifications');
  }, [router]);

  const handleViewAllDeals = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/catalog?filter=deals');
  }, [router]);

  const handleViewAllCategories = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/catalog');
  }, [router]);

  const featuredProducts = featuredQuery.data ?? [];
  const dealsProducts = dealsQuery.data ?? [];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {user.firstName || 'Guest'} 👋</Text>
            <Text style={styles.subtitle}>What are you looking for today?</Text>
          </View>
          <Pressable style={styles.notificationButton} onPress={handleNotifications}>
            <Bell size={22} color={Colors.light.text} />
            <View style={styles.notificationBadge} />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFilterPress={() => router.push('/catalog')}
            placeholder="Search products, brands..."
          />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />
        }
      >
        <Pressable style={styles.promoBanner} onPress={handleViewAllDeals}>
          <LinearGradient
            colors={[Colors.light.gradientStart, Colors.light.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoGradient}
          >
            <View style={styles.promoContent}>
              <View style={styles.promoTextContainer}>
                <View style={styles.promoTag}>
                  <Zap size={12} color="#FFF" fill="#FFF" />
                  <Text style={styles.promoTagText}>FLASH SALE</Text>
                </View>
                <Text style={styles.promoTitle}>Up to 50% Off</Text>
                <Text style={styles.promoSubtitle}>On Electronics & Fashion</Text>
              </View>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' }}
                style={styles.promoImage}
                contentFit="contain"
              />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={handleViewAllDeals}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Flame size={20} color="#EF4444" />
            </View>
            <Text style={styles.quickActionText}>Hot Deals</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={handleViewAllDeals}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Zap size={20} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionText}>Flash Sale</Text>
          </Pressable>
          <Pressable style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Gift size={20} color="#10B981" />
            </View>
            <Text style={styles.quickActionText}>Free Ship</Text>
          </Pressable>
        </View>

        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <Pressable style={styles.viewAllButton} onPress={handleViewAllCategories}>
                <Text style={styles.viewAllText}>View All</Text>
                <ChevronRight size={16} color={Colors.light.secondary} />
              </Pressable>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.slice(0, 6).map(category => (
                <View key={category.id} style={styles.categoryItem}>
                  <CategoryCard category={category} size="small" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Hot Deals</Text>
            <Pressable style={styles.viewAllButton} onPress={handleViewAllDeals}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={Colors.light.secondary} />
            </Pressable>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.secondary} />
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {dealsProducts.map(product => (
                <View key={product.id} style={styles.productItem}>
                  <ProductCard product={product} />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <Pressable style={styles.viewAllButton} onPress={() => router.push('/catalog')}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={Colors.light.secondary} />
            </Pressable>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.secondary} />
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {featuredProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <View style={[styles.trustIcon, { backgroundColor: '#DBEAFE' }]}>
              <Zap size={18} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.trustTitle}>Fast Delivery</Text>
              <Text style={styles.trustSubtitle}>3-10 business days</Text>
            </View>
          </View>
          <View style={styles.trustItem}>
            <View style={[styles.trustIcon, { backgroundColor: '#D1FAE5' }]}>
              <Gift size={18} color="#10B981" />
            </View>
            <View>
              <Text style={styles.trustTitle}>Free Returns</Text>
              <Text style={styles.trustSubtitle}>Within 30 days</Text>
            </View>
          </View>
        </View>

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
  promoBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  promoGradient: {
    padding: 20,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  promoTagText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  promoTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  promoImage: {
    width: 100,
    height: 100,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondary,
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
  bottomSpacing: {
    height: 20,
  },
  trustSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  trustIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  trustSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
});
