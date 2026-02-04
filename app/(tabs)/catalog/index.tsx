import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { X, Check, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import SearchBar from '@/components/SearchBar';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/Button';
import { trpc } from '@/lib/trpc';
import { useApp } from '@/providers/AppProvider';
import { Product } from '@/types';

type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
];

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ category?: string; search?: string; filter?: string }>();
  const { categories } = useApp();
  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category || null);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(true);

  const productsQuery = trpc.products.list.useQuery({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    sortBy,
    inStockOnly,
    freeShippingOnly,
    limit: 50,
  });

  const dealsQuery = trpc.products.deals.useQuery(undefined, {
    enabled: params.filter === 'deals',
  });

  const products = useMemo(() => {
    if (params.filter === 'deals' && dealsQuery.data) {
      return dealsQuery.data;
    }
    return productsQuery.data?.products ?? [];
  }, [params.filter, dealsQuery.data, productsQuery.data]);

  const isLoading = productsQuery.isLoading || (params.filter === 'deals' && dealsQuery.isLoading);
  const totalProducts = params.filter === 'deals' 
    ? (dealsQuery.data?.length ?? 0)
    : (productsQuery.data?.total ?? 0);

  const handleCategoryPress = useCallback((categoryId: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  }, [selectedCategory]);

  const handleSortPress = useCallback((value: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(value);
    setShowSortModal(false);
  }, []);

  const renderProduct = useCallback(({ item, index }: { item: Product; index: number }) => (
    <View style={[styles.productItem, index % 2 === 0 ? styles.productItemLeft : styles.productItemRight]}>
      <ProductCard product={item} />
    </View>
  ), []);

  const currentSort = sortOptions.find(s => s.value === sortBy)?.label || 'Sort';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Catalog</Text>
          <Text style={styles.resultCount}>{totalProducts} products</Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFilterPress={() => setShowFilterModal(true)}
            placeholder="Search in catalog..."
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <Pressable
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => handleCategoryPress(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              All
            </Text>
          </Pressable>
          {categories.map(category => (
            <Pressable
              key={category.id}
              style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Text style={[
                styles.categoryChipText, 
                selectedCategory === category.id && styles.categoryChipTextActive
              ]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sortContainer}>
          <Pressable style={styles.sortButton} onPress={() => setShowSortModal(true)}>
            <Text style={styles.sortText}>{currentSort}</Text>
            <ChevronDown size={16} color={Colors.light.textSecondary} />
          </Pressable>
          <View style={styles.filterTags}>
            {freeShippingOnly && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>Free Shipping</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.secondary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters or search query</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <Pressable onPress={() => setShowSortModal(false)}>
                <X size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            {sortOptions.map(option => (
              <Pressable
                key={option.value}
                style={styles.sortOption}
                onPress={() => handleSortPress(option.value)}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Check size={20} color={Colors.light.secondary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <X size={24} color={Colors.light.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.filterBody}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Shipping</Text>
                <Pressable
                  style={styles.filterOption}
                  onPress={() => setFreeShippingOnly(!freeShippingOnly)}
                >
                  <Text style={styles.filterOptionText}>Free Shipping Only</Text>
                  <View style={[styles.checkbox, freeShippingOnly && styles.checkboxActive]}>
                    {freeShippingOnly && <Check size={14} color="#FFF" />}
                  </View>
                </Pressable>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Availability</Text>
                <Pressable
                  style={styles.filterOption}
                  onPress={() => setInStockOnly(!inStockOnly)}
                >
                  <Text style={styles.filterOptionText}>In Stock Only</Text>
                  <View style={[styles.checkbox, inStockOnly && styles.checkboxActive]}>
                    {inStockOnly && <Check size={14} color="#FFF" />}
                  </View>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.filterFooter}>
              <Button
                title="Reset"
                variant="outline"
                onPress={() => {
                  setFreeShippingOnly(false);
                  setInStockOnly(true);
                }}
                style={styles.resetButton}
              />
              <Button
                title="Apply Filters"
                onPress={() => setShowFilterModal(false)}
                style={styles.applyButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  resultCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceSecondary,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  filterTags: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTag: {
    backgroundColor: `${Colors.light.secondary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterTagText: {
    fontSize: 12,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  productsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  productItem: {
    flex: 1,
    maxWidth: '50%',
  },
  productItemLeft: {
    paddingRight: 6,
  },
  productItemRight: {
    paddingLeft: 6,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  sortOptionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  sortOptionTextActive: {
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  filterBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  filterOptionText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.light.secondary,
    borderColor: Colors.light.secondary,
  },
  filterFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    gap: 12,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});
