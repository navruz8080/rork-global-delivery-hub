import React, { useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShoppingBag, Truck, Shield, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import CartItemCard from '@/components/CartItemCard';
import Button from '@/components/Button';
import { useApp } from '@/providers/AppProvider';

export default function CartScreen() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useApp();

  const shippingCost = useMemo(() => {
    if (cartTotal >= 100) return 0;
    return cart.reduce((max, item) => Math.max(max, item.product.deliveryInfo.shippingCost), 0);
  }, [cart, cartTotal]);

  const totalWithShipping = cartTotal + shippingCost;
  const freeShippingProgress = Math.min(cartTotal / 100, 1);
  const amountToFreeShipping = Math.max(100 - cartTotal, 0);

  const handleCheckout = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/checkout');
  }, [router]);

  const handleContinueShopping = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/catalog');
  }, [router]);

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>My Cart</Text>
          </View>
        </SafeAreaView>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <ShoppingBag size={48} color={Colors.light.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Looks like you haven't added anything yet</Text>
          <Button
            title="Start Shopping"
            onPress={handleContinueShopping}
            style={styles.startShoppingButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>My Cart</Text>
          <Text style={styles.itemCount}>{cart.length} items</Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {amountToFreeShipping > 0 && (
          <View style={styles.freeShippingBanner}>
            <View style={styles.freeShippingHeader}>
              <Truck size={18} color={Colors.light.secondary} />
              <Text style={styles.freeShippingText}>
                Add ${amountToFreeShipping.toFixed(2)} for free shipping
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${freeShippingProgress * 100}%` }]} />
            </View>
          </View>
        )}

        {amountToFreeShipping <= 0 && (
          <View style={[styles.freeShippingBanner, styles.freeShippingSuccess]}>
            <Truck size={18} color={Colors.light.success} />
            <Text style={[styles.freeShippingText, styles.freeShippingSuccessText]}>
              You've unlocked free shipping! 🎉
            </Text>
          </View>
        )}

        <View style={styles.itemsContainer}>
          {cart.map(item => (
            <CartItemCard key={item.product.id} item={item} />
          ))}
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Shield size={20} color={Colors.light.secondary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Buyer Protection</Text>
              <Text style={styles.featureSubtitle}>Full refund if item isn't as described</Text>
            </View>
          </View>
          <View style={styles.feature}>
            <Truck size={20} color={Colors.light.secondary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>International Delivery</Text>
              <Text style={styles.featureSubtitle}>Worldwide shipping available</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={[styles.summaryValue, shippingCost === 0 && styles.freeText]}>
              {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${totalWithShipping.toFixed(2)}</Text>
          </View>
        </View>
        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          size="large"
          icon={<ArrowRight size={20} color="#FFF" />}
          iconPosition="right"
          style={styles.checkoutButton}
        />
      </SafeAreaView>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  freeShippingBanner: {
    backgroundColor: `${Colors.light.secondary}10`,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  freeShippingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  freeShippingText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: `${Colors.light.secondary}20`,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.secondary,
    borderRadius: 3,
  },
  freeShippingSuccess: {
    backgroundColor: `${Colors.light.success}10`,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeShippingSuccessText: {
    color: Colors.light.success,
  },
  itemsContainer: {
    marginBottom: 24,
  },
  featuresContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  featureSubtitle: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  footer: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  checkoutButton: {
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  startShoppingButton: {
    minWidth: 200,
  },
});
