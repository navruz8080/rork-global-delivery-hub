import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, Trash2, ShoppingCart, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp, useFavoriteProducts } from '@/providers/AppProvider';
import { Product } from '@/types';

function EmptyState() {
  const router = useRouter();
  
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Heart size={48} color={Colors.light.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptySubtitle}>
        Save items you love by tapping the heart icon
      </Text>
      <Pressable 
        style={styles.browseButton}
        onPress={() => router.push('/catalog')}
      >
        <Text style={styles.browseButtonText}>Browse Products</Text>
      </Pressable>
    </View>
  );
}

interface FavoriteItemProps {
  product: Product;
  onRemove: () => void;
  onAddToCart: () => void;
  onPress: () => void;
}

function FavoriteItem({ product, onRemove, onAddToCart, onPress }: FavoriteItemProps) {
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <Pressable style={styles.itemCard} onPress={onPress}>
      <Image
        source={{ uri: product.images[0] }}
        style={styles.itemImage}
        contentFit="cover"
      />
      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{discount}%</Text>
        </View>
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemBrand}>{product.seller.name}</Text>
        <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>${product.price}</Text>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>${product.originalPrice}</Text>
          )}
        </View>
        <View style={styles.deliveryInfo}>
          <Package size={12} color={Colors.light.textTertiary} />
          <Text style={styles.deliveryText}>
            {product.deliveryInfo.estimatedDays.min}-{product.deliveryInfo.estimatedDays.max} days
          </Text>
        </View>
        <View style={styles.itemActions}>
          <Pressable style={styles.addToCartButton} onPress={onAddToCart}>
            <ShoppingCart size={16} color="#FFF" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </Pressable>
          <Pressable style={styles.removeButton} onPress={onRemove}>
            <Trash2 size={18} color={Colors.light.error} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function FavoritesScreen() {
  const router = useRouter();
  const { toggleFavorite, addToCart, isAuthenticated } = useApp();
  const favoriteProducts = useFavoriteProducts();
  const [sortBy, setSortBy] = useState<'recent' | 'price_low' | 'price_high'>('recent');

  const sortedProducts = [...favoriteProducts].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return 0;
  });

  const handleRemove = useCallback((productId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleFavorite(productId);
  }, [toggleFavorite]);

  const handleAddToCart = useCallback((product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addToCart(product, 1);
  }, [addToCart]);

  const handleProductPress = useCallback((productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/product/${productId}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <FavoriteItem
      product={item}
      onRemove={() => handleRemove(item.id)}
      onAddToCart={() => handleAddToCart(item)}
      onPress={() => handleProductPress(item.id)}
    />
  ), [handleRemove, handleAddToCart, handleProductPress]);

  const showEmptyState = !isAuthenticated || favoriteProducts.length === 0;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Wishlist</Text>
          {favoriteProducts.length > 0 && (
            <Text style={styles.itemCount}>{favoriteProducts.length} items</Text>
          )}
        </View>
        {favoriteProducts.length > 0 && (
          <View style={styles.sortContainer}>
            <Pressable 
              style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
              onPress={() => setSortBy('recent')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'recent' && styles.sortButtonTextActive]}>
                Recent
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.sortButton, sortBy === 'price_low' && styles.sortButtonActive]}
              onPress={() => setSortBy('price_low')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'price_low' && styles.sortButtonTextActive]}>
                Price: Low
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.sortButton, sortBy === 'price_high' && styles.sortButtonActive]}
              onPress={() => setSortBy('price_high')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'price_high' && styles.sortButtonTextActive]}>
                Price: High
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {showEmptyState ? (
        <EmptyState />
      ) : (
        <FlatList
          data={sortedProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  sortButtonActive: {
    backgroundColor: Colors.light.text,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  sortButtonTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 20,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: 120,
    height: 140,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.light.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  itemBrand: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    lineHeight: 18,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  originalPrice: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    textDecorationLine: 'line-through',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  deliveryText: {
    fontSize: 11,
    color: Colors.light.textTertiary,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `${Colors.light.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
