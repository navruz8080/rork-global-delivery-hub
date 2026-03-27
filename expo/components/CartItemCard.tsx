import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { CartItem } from '@/types';
import { useApp } from '@/providers/AppProvider';

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const { updateCartQuantity, removeFromCart } = useApp();

  const handleIncrease = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateCartQuantity(item.product.id, item.quantity + 1);
  }, [item.product.id, item.quantity, updateCartQuantity]);

  const handleDecrease = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.quantity > 1) {
      updateCartQuantity(item.product.id, item.quantity - 1);
    }
  }, [item.product.id, item.quantity, updateCartQuantity]);

  const handleRemove = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeFromCart(item.product.id);
  }, [item.product.id, removeFromCart]);

  return (
    <View style={styles.card} testID={`cart-item-${item.product.id}`}>
      <Image 
        source={{ uri: item.product.images[0] }} 
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
          <Pressable onPress={handleRemove} hitSlop={8} style={styles.removeButton}>
            <Trash2 size={18} color={Colors.light.error} />
          </Pressable>
        </View>
        
        <Text style={styles.seller}>{item.product.seller.name}</Text>
        
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${item.product.price}</Text>
            {item.product.originalPrice && (
              <Text style={styles.originalPrice}>${item.product.originalPrice}</Text>
            )}
          </View>
          
          <View style={styles.quantityContainer}>
            <Pressable 
              style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]} 
              onPress={handleDecrease}
              disabled={item.quantity <= 1}
            >
              <Minus size={16} color={item.quantity <= 1 ? Colors.light.textTertiary : Colors.light.text} />
            </Pressable>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Pressable style={styles.quantityButton} onPress={handleIncrease}>
              <Plus size={16} color={Colors.light.text} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 8,
    lineHeight: 20,
  },
  removeButton: {
    padding: 4,
  },
  seller: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceContainer: {
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 10,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: 'transparent',
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
});
