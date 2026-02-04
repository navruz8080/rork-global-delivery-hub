import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  MapPin,
  Copy,
  MessageCircle,
  RefreshCw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import TrackingTimeline from '@/components/TrackingTimeline';
import { useApp } from '@/providers/AppProvider';
import { trpc } from '@/lib/trpc';
import { OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; color: string; description: string }> = {
  pending: { label: 'Pending', color: Colors.light.warning, description: 'Waiting for confirmation' },
  confirmed: { label: 'Confirmed', color: Colors.light.info, description: 'Order has been confirmed' },
  processing: { label: 'Processing', color: Colors.light.info, description: 'Seller is preparing your order' },
  shipped: { label: 'Shipped', color: Colors.light.secondary, description: 'Package has been shipped' },
  in_transit: { label: 'In Transit', color: Colors.light.secondary, description: 'Package is on its way' },
  out_for_delivery: { label: 'Out for Delivery', color: Colors.light.success, description: 'Package will arrive today' },
  delivered: { label: 'Delivered', color: Colors.light.success, description: 'Package has been delivered' },
  cancelled: { label: 'Cancelled', color: Colors.light.error, description: 'Order has been cancelled' },
  returned: { label: 'Returned', color: Colors.light.textTertiary, description: 'Order has been returned' },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useApp();

  const orderQuery = trpc.orders.getById.useQuery(
    { id: id || '' },
    { enabled: !!id && isAuthenticated }
  );

  const order = orderQuery.data;

  const handleCopyTracking = useCallback(() => {
    if (order?.trackingNumber) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copied', 'Tracking number copied to clipboard');
    }
  }, [order?.trackingNumber]);

  const handleContactSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Contact Support', 'Support chat would open here');
  }, []);

  const handleReorder = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Reorder', 'Items would be added to cart');
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (orderQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.secondary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Order not found</Text>
      </View>
    );
  }

  const config = statusConfig[order.status];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, { backgroundColor: `${config.color}15` }]}>
          {order.status === 'delivered' ? (
            <CheckCircle size={32} color={config.color} />
          ) : order.status === 'in_transit' || order.status === 'shipped' ? (
            <Truck size={32} color={config.color} />
          ) : (
            <Package size={32} color={config.color} />
          )}
        </View>
        <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.statusDescription}>{config.description}</Text>
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <Text style={styles.estimatedDelivery}>
            Estimated delivery: {formatDate(order.estimatedDelivery)}
          </Text>
        )}
      </View>

      {order.trackingNumber && (
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <Text style={styles.trackingLabel}>Tracking Number</Text>
            <Pressable style={styles.copyButton} onPress={handleCopyTracking}>
              <Copy size={16} color={Colors.light.secondary} />
              <Text style={styles.copyText}>Copy</Text>
            </Pressable>
          </View>
          <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tracking History</Text>
        <View style={styles.timelineCard}>
          <TrackingTimeline events={order.trackingHistory} currentStatus={order.status} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items ({order.items.length})</Text>
        <View style={styles.itemsCard}>
          {order.items.map((item, index) => (
            <Pressable 
              key={item.product.id} 
              style={[
                styles.orderItem,
                index < order.items.length - 1 && styles.orderItemBorder,
              ]}
              onPress={() => router.push(`/product/${item.product.id}`)}
            >
              <Image 
                source={{ uri: item.product.images[0] }} 
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.itemSeller}>{item.product.seller.name}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>${item.priceAtPurchase}</Text>
                  <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.addressCard}>
          <View style={styles.addressIcon}>
            <MapPin size={20} color={Colors.light.secondary} />
          </View>
          <View style={styles.addressInfo}>
            <Text style={styles.addressName}>{order.shippingAddress.fullName}</Text>
            <Text style={styles.addressLine}>{order.shippingAddress.phone}</Text>
            <Text style={styles.addressLine}>
              {order.shippingAddress.street}, {order.shippingAddress.building}
              {order.shippingAddress.apartment && `, Apt ${order.shippingAddress.apartment}`}
            </Text>
            <Text style={styles.addressLine}>
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}
            </Text>
            <Text style={styles.addressLine}>{order.shippingAddress.country}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${(order.totalAmount - order.shippingCost).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={[styles.summaryValue, order.shippingCost === 0 && styles.freeText]}>
              {order.shippingCost === 0 ? 'Free' : `$${order.shippingCost.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentMethod}>
            <Text style={styles.paymentLabel}>Paid with</Text>
            <Text style={styles.paymentValue}>{order.paymentMethod}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <Button
          title="Contact Support"
          variant="outline"
          onPress={handleContactSupport}
          icon={<MessageCircle size={18} color={Colors.light.secondary} />}
          style={styles.actionButton}
        />
        {order.status === 'delivered' && (
          <Button
            title="Reorder"
            onPress={handleReorder}
            icon={<RefreshCw size={18} color="#FFF" />}
            style={styles.actionButton}
          />
        )}
      </View>

      <Text style={styles.orderMeta}>
        Order placed on {formatDate(order.createdAt)}
      </Text>
      <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  statusCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  estimatedDelivery: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 4,
  },
  trackingCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 13,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  trackingNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  timelineCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
  },
  itemsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  orderItem: {
    flexDirection: 'row',
    padding: 16,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    lineHeight: 20,
  },
  itemSeller: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  addressCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.light.secondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  freeText: {
    color: Colors.light.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  paymentLabel: {
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  orderMeta: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: 'center',
  },
});
