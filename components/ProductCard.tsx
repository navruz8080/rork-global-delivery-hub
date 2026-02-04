import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart, Star, Truck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Product } from '@/types';
import { useApp } from '@/providers/AppProvider';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'horizontal';
}

export default function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useApp();
  const favorite = isFavorite(product.id);

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/product/${product.id}`);
  }, [product.id, router]);

  const handleFavorite = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(product.id);
  }, [product.id, toggleFavorite]);

  if (variant === 'horizontal') {
    return (
      <Pressable 
        style={styles.horizontalCard} 
        onPress={handlePress}
        testID={`product-card-${product.id}`}
      >
        <Image 
          source={{ uri: product.images[0] }} 
          style={styles.horizontalImage}
          contentFit="cover"
        />
        <View style={styles.horizontalContent}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <Star size={12} color={Colors.light.rating} fill={Colors.light.rating} />
            <Text style={styles.rating}>{product.rating}</Text>
            <Text style={styles.reviews}>({product.reviewCount})</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice}</Text>
            )}
          </View>
          {product.deliveryInfo.shippingCost === 0 && (
            <View style={styles.freeShipping}>
              <Truck size={10} color={Colors.light.success} />
              <Text style={styles.freeShippingText}>Free Shipping</Text>
            </View>
          )}
        </View>
        <Pressable style={styles.favoriteButton} onPress={handleFavorite}>
          <Heart 
            size={18} 
            color={favorite ? Colors.light.error : Colors.light.textTertiary}
            fill={favorite ? Colors.light.error : 'transparent'}
          />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Pressable 
      style={styles.card} 
      onPress={handlePress}
      testID={`product-card-${product.id}`}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.images[0] }} 
          style={styles.image}
          contentFit="cover"
        />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        <Pressable style={styles.heartButton} onPress={handleFavorite}>
          <Heart 
            size={18} 
            color={favorite ? Colors.light.error : Colors.light.textTertiary}
            fill={favorite ? Colors.light.error : 'transparent'}
          />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Star size={12} color={Colors.light.rating} fill={Colors.light.rating} />
          <Text style={styles.rating}>{product.rating}</Text>
          <Text style={styles.reviews}>({product.reviewCount})</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${product.price}</Text>
          {product.originalPrice && (
            <Text style={styles.originalPrice}>${product.originalPrice}</Text>
          )}
        </View>
        {product.deliveryInfo.shippingCost === 0 && (
          <View style={styles.freeShipping}>
            <Truck size={10} color={Colors.light.success} />
            <Text style={styles.freeShippingText}>Free Shipping</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.light.discount,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 4,
  },
  reviews: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    marginLeft: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  originalPrice: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    textDecorationLine: 'line-through',
  },
  freeShipping: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  freeShippingText: {
    fontSize: 10,
    color: Colors.light.success,
    fontWeight: '500',
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  horizontalImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  horizontalContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
