import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Share2,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import ReviewCard from '@/components/ReviewCard';
import { useApp, useCartItem } from '@/providers/AppProvider';
import { trpc } from '@/lib/trpc';
import { productReviews } from '@/mocks/notifications';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart, toggleFavorite, isFavorite } = useApp();
  useCartItem(id || '');
  
  const productQuery = trpc.products.getById.useQuery(
    { id: id || '' },
    { enabled: !!id }
  );

  const product = productQuery.data;
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const favorite = product ? isFavorite(product.id) : false;
  const discount = product?.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, quantity, addToCart]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(product, quantity);
    router.push('/checkout');
  }, [product, quantity, addToCart, router]);

  const handleFavorite = useCallback(() => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(product.id);
  }, [product, toggleFavorite]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Share', 'Sharing functionality would be implemented here');
  }, []);

  if (productQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.secondary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable style={styles.headerButton} onPress={handleShare}>
                <Share2 size={20} color={Colors.light.text} />
              </Pressable>
              <Pressable style={styles.headerButton} onPress={handleFavorite}>
                <Heart 
                  size={20} 
                  color={favorite ? Colors.light.error : Colors.light.text}
                  fill={favorite ? Colors.light.error : 'transparent'}
                />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.images[selectedImageIndex] }} 
            style={styles.mainImage}
            contentFit="cover"
          />
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          )}
        </View>

        {product.images.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailsContainer}
          >
            {product.images.map((image, index) => (
              <Pressable
                key={index}
                style={[
                  styles.thumbnail,
                  selectedImageIndex === index && styles.thumbnailActive,
                ]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image source={{ uri: image }} style={styles.thumbnailImage} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          <Pressable style={styles.sellerRow} onPress={() => router.push(`/seller/${product.seller.id}`)}>
            <Text style={styles.sellerName}>{product.seller.name}</Text>
            {product.seller.verified && (
              <View style={styles.verifiedBadge}>
                <Check size={10} color="#FFF" />
              </View>
            )}
            <ChevronRight size={14} color={Colors.light.textTertiary} />
          </Pressable>

          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <Star size={16} color={Colors.light.rating} fill={Colors.light.rating} />
            <Text style={styles.rating}>{product.rating}</Text>
            <Text style={styles.reviews}>({product.reviewCount} reviews)</Text>
            <Text style={styles.sold}>• {product.stockCount} in stock</Text>
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.price}>${product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice}</Text>
            )}
          </View>

          <View style={styles.deliveryInfo}>
            <Truck size={18} color={Colors.light.secondary} />
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryTitle}>
                {product.deliveryInfo.shippingCost === 0 ? 'Free Shipping' : `Shipping: $${product.deliveryInfo.shippingCost}`}
              </Text>
              <Text style={styles.deliverySubtitle}>
                Estimated delivery: {product.deliveryInfo.estimatedDays.min}-{product.deliveryInfo.estimatedDays.max} days
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            {Object.entries(product.specifications).map(([key, value]) => (
              <View key={key} style={styles.specRow}>
                <Text style={styles.specKey}>{key}</Text>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.guaranteeSection}>
            <View style={styles.guarantee}>
              <Shield size={20} color={Colors.light.success} />
              <Text style={styles.guaranteeText}>Buyer Protection</Text>
            </View>
            <View style={styles.guarantee}>
              <Truck size={20} color={Colors.light.success} />
              <Text style={styles.guaranteeText}>Fast Delivery</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <View style={styles.ratingOverview}>
                <Star size={18} color={Colors.light.rating} fill={Colors.light.rating} />
                <Text style={styles.overviewRating}>{product.rating}</Text>
                <Text style={styles.overviewCount}>({product.reviewCount})</Text>
              </View>
            </View>
            {productReviews.filter(r => r.productId === product.id).slice(0, 2).map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {productReviews.filter(r => r.productId === product.id).length === 0 && (
              <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Qty:</Text>
          <View style={styles.quantityControls}>
            <Pressable
              style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={() => quantity > 1 && setQuantity(q => q - 1)}
              disabled={quantity <= 1}
            >
              <Minus size={16} color={quantity <= 1 ? Colors.light.textTertiary : Colors.light.text} />
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable
              style={styles.quantityButton}
              onPress={() => setQuantity(q => q + 1)}
            >
              <Plus size={16} color={Colors.light.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.footerButtons}>
          <Button
            title={addedToCart ? 'Added!' : 'Add to Cart'}
            variant="outline"
            onPress={handleAddToCart}
            icon={addedToCart ? <Check size={18} color={Colors.light.success} /> : <ShoppingCart size={18} color={Colors.light.secondary} />}
            style={styles.addToCartButton}
            textStyle={addedToCart ? { color: Colors.light.success } : undefined}
          />
          <Button
            title="Buy Now"
            onPress={handleBuyNow}
            style={styles.buyNowButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: Colors.light.surfaceSecondary,
  },
  mainImage: {
    width: width,
    height: width,
  },
  discountBadge: {
    position: 'absolute',
    top: 100,
    left: 16,
    backgroundColor: Colors.light.discount,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  thumbnailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: Colors.light.secondary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 20,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  sellerName: {
    fontSize: 13,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.verified,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
    lineHeight: 28,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    marginLeft: 4,
  },
  sold: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    marginLeft: 8,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
  },
  originalPrice: {
    fontSize: 18,
    color: Colors.light.textTertiary,
    textDecorationLine: 'line-through',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.light.secondary}10`,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  deliveryText: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  deliverySubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  specKey: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  guaranteeSection: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guaranteeText: {
    fontSize: 13,
    color: Colors.light.success,
    fontWeight: '500',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overviewRating: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  overviewCount: {
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  noReviews: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  footer: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginRight: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 10,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: 'transparent',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  addToCartButton: {
    flex: 1,
  },
  buyNowButton: {
    flex: 1,
  },
});
