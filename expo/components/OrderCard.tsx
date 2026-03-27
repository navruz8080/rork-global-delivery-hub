import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Order, OrderStatus } from '@/types';

interface OrderCardProps {
  order: Order;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: 'Pending', color: Colors.light.warning, icon: Clock },
  confirmed: { label: 'Confirmed', color: Colors.light.info, icon: CheckCircle },
  processing: { label: 'Processing', color: Colors.light.info, icon: Package },
  shipped: { label: 'Shipped', color: Colors.light.secondary, icon: Truck },
  in_transit: { label: 'In Transit', color: Colors.light.secondary, icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', color: Colors.light.success, icon: Truck },
  delivered: { label: 'Delivered', color: Colors.light.success, icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: Colors.light.error, icon: XCircle },
  returned: { label: 'Returned', color: Colors.light.textTertiary, icon: Package },
};

export default function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();
  const config = statusConfig[order.status];
  const StatusIcon = config.icon;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/order/${order.id}`);
  }, [order.id, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Pressable 
      style={styles.card} 
      onPress={handlePress}
      testID={`order-card-${order.id}`}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${config.color}15` }]}>
          <StatusIcon size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {order.items.slice(0, 3).map((item, index) => (
          <View key={item.product.id} style={styles.itemImage}>
            <Image 
              source={{ uri: item.product.images[0] }} 
              style={styles.productImage}
              contentFit="cover"
            />
            {item.quantity > 1 && (
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>×{item.quantity}</Text>
              </View>
            )}
          </View>
        ))}
        {order.items.length > 3 && (
          <View style={styles.moreItems}>
            <Text style={styles.moreItemsText}>+{order.items.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${order.totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.viewDetails}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <ChevronRight size={16} color={Colors.light.secondary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  itemImage: {
    position: 'relative',
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  quantityBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  moreItems: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
});
