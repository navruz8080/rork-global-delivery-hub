import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { 
  MapPin, 
  CreditCard, 
  ChevronRight,
  Truck,
  Shield,
  Check,
  Tag,
  X,
  Percent,
  LogIn,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { useApp } from '@/providers/AppProvider';
import { trpc } from '@/lib/trpc';
import { ShippingOption } from '@/types';
import { PromoCode } from '@/types/notifications';
import { promoCodes } from '@/mocks/notifications';

const shippingOptions: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Shipping',
    estimatedDays: { min: 7, max: 14 },
    price: 0,
    carrier: 'Multiple Carriers',
  },
  {
    id: 'express',
    name: 'Express Shipping',
    estimatedDays: { min: 3, max: 5 },
    price: 15,
    carrier: 'DHL Express',
  },
  {
    id: 'priority',
    name: 'Priority Shipping',
    estimatedDays: { min: 1, max: 3 },
    price: 29,
    carrier: 'FedEx Priority',
  },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, cartTotal, user, clearCart, isAuthenticated, refetchOrders } = useApp();
  const [selectedShipping, setSelectedShipping] = useState(shippingOptions[0]);
  const [selectedAddress] = useState(user.addresses?.find(a => a.isDefault) || user.addresses?.[0]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoError, setPromoError] = useState('');

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      clearCart();
      refetchOrders();
      Alert.alert(
        'Order Placed!',
        'Your order has been placed successfully. You can track it in the Orders section.',
        [
          {
            text: 'View Orders',
            onPress: () => router.replace('/(tabs)/orders'),
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to place order');
    },
  });

  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    
    if (appliedPromo.discountType === 'percentage') {
      const calculated = cartTotal * (appliedPromo.discountValue / 100);
      return appliedPromo.maxDiscount ? Math.min(calculated, appliedPromo.maxDiscount) : calculated;
    } else if (appliedPromo.discountType === 'fixed') {
      return appliedPromo.discountValue;
    }
    return 0;
  }, [appliedPromo, cartTotal]);

  const shippingCost = useMemo(() => {
    if (appliedPromo?.discountType === 'free_shipping') return 0;
    return selectedShipping.price;
  }, [appliedPromo, selectedShipping]);

  const totalWithShipping = cartTotal - discount + shippingCost;

  const handleApplyPromo = useCallback(() => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    const foundPromo = promoCodes.find(pc => pc.code === code && pc.isActive);
    
    if (!foundPromo) {
      setPromoError('Invalid promo code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (foundPromo.minOrderAmount && cartTotal < foundPromo.minOrderAmount) {
      setPromoError(`Minimum order amount is $${foundPromo.minOrderAmount}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const now = new Date();
    const validFrom = new Date(foundPromo.validFrom);
    const validUntil = new Date(foundPromo.validUntil);
    
    if (now < validFrom || now > validUntil) {
      setPromoError('This promo code has expired');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (foundPromo.usageLimit > 0 && foundPromo.usageCount >= foundPromo.usageLimit) {
      setPromoError('This promo code has reached its usage limit');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setAppliedPromo(foundPromo);
    setShowPromoModal(false);
    setPromoCode('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [promoCode, cartTotal]);

  const handleRemovePromo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppliedPromo(null);
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please add a delivery address');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    createOrderMutation.mutate({
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      shippingAddress: selectedAddress,
      paymentMethod: 'Visa •••• 4242',
    });
  }, [cart, selectedAddress, createOrderMutation]);

  const handleSelectShipping = useCallback((option: ShippingOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedShipping(option);
  }, []);

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.authIcon}>
          <LogIn size={48} color={Colors.light.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>Sign in to checkout</Text>
        <Text style={styles.emptyText}>You need to be signed in to complete your purchase</Text>
        <Button title="Sign In" onPress={() => router.push('/(tabs)/profile')} />
      </View>
    );
  }

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Button title="Go Shopping" onPress={() => router.replace('/(tabs)/catalog')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          {selectedAddress ? (
            <Pressable style={styles.addressCard} onPress={() => router.push('/addresses')}>
              <View style={styles.addressIcon}>
                <MapPin size={20} color={Colors.light.secondary} />
              </View>
              <View style={styles.addressInfo}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                  {selectedAddress.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
                <Text style={styles.addressLine}>
                  {selectedAddress.street}, {selectedAddress.building}
                </Text>
                <Text style={styles.addressLine}>
                  {selectedAddress.city}, {selectedAddress.postalCode}, {selectedAddress.country}
                </Text>
              </View>
              <ChevronRight size={20} color={Colors.light.textTertiary} />
            </Pressable>
          ) : (
            <Pressable style={styles.addressCard} onPress={() => router.push('/addresses')}>
              <View style={styles.addressIcon}>
                <MapPin size={20} color={Colors.light.secondary} />
              </View>
              <Text style={styles.addAddressText}>Add shipping address</Text>
              <ChevronRight size={20} color={Colors.light.textTertiary} />
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Method</Text>
          {shippingOptions.map(option => (
            <Pressable
              key={option.id}
              style={[
                styles.shippingOption,
                selectedShipping.id === option.id && styles.shippingOptionActive,
              ]}
              onPress={() => handleSelectShipping(option)}
            >
              <View style={styles.shippingRadio}>
                {selectedShipping.id === option.id && (
                  <View style={styles.shippingRadioInner} />
                )}
              </View>
              <View style={styles.shippingInfo}>
                <Text style={styles.shippingName}>{option.name}</Text>
                <Text style={styles.shippingDetails}>
                  {option.estimatedDays.min}-{option.estimatedDays.max} days • {option.carrier}
                </Text>
              </View>
              <Text style={[
                styles.shippingPrice,
                (option.price === 0 || (appliedPromo?.discountType === 'free_shipping' && option.id === 'standard')) && styles.freePrice,
              ]}>
                {option.price === 0 || (appliedPromo?.discountType === 'free_shipping' && option.id === 'standard') ? 'Free' : `$${option.price}`}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Pressable style={styles.paymentCard} onPress={() => router.push('/payment-methods')}>
            <View style={styles.paymentIcon}>
              <CreditCard size={20} color={Colors.light.secondary} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Visa •••• 4242</Text>
              <Text style={styles.paymentExpiry}>Expires 12/25</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.textTertiary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          {appliedPromo ? (
            <View style={styles.appliedPromoCard}>
              <View style={styles.promoIconSuccess}>
                <Tag size={18} color={Colors.light.success} />
              </View>
              <View style={styles.promoInfo}>
                <Text style={styles.promoCodeText}>{appliedPromo.code}</Text>
                <Text style={styles.promoDescription}>{appliedPromo.description}</Text>
              </View>
              <Pressable style={styles.removePromoButton} onPress={handleRemovePromo}>
                <X size={18} color={Colors.light.textTertiary} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.promoCard} onPress={() => setShowPromoModal(true)}>
              <View style={styles.promoIconContainer}>
                <Tag size={18} color={Colors.light.secondary} />
              </View>
              <Text style={styles.promoPlaceholder}>Enter promo code</Text>
              <ChevronRight size={20} color={Colors.light.textTertiary} />
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary ({cart.length} items)</Text>
          <View style={styles.itemsCard}>
            {cart.map((item, index) => (
              <View 
                key={item.product.id} 
                style={[
                  styles.orderItem,
                  index < cart.length - 1 && styles.orderItemBorder,
                ]}
              >
                <Image 
                  source={{ uri: item.product.images[0] }} 
                  style={styles.itemImage}
                  contentFit="cover"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.product.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.guaranteeSection}>
          <View style={styles.guarantee}>
            <Shield size={18} color={Colors.light.success} />
            <Text style={styles.guaranteeText}>Buyer Protection Guarantee</Text>
          </View>
          <View style={styles.guarantee}>
            <Truck size={18} color={Colors.light.success} />
            <Text style={styles.guaranteeText}>Secure International Shipping</Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
          </View>
          {appliedPromo && discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Discount</Text>
              <Text style={styles.discountValue}>-${discount.toFixed(2)}</Text>
            </View>
          )}
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
          {appliedPromo && (
            <View style={styles.savingsRow}>
              <Percent size={14} color={Colors.light.success} />
              <Text style={styles.savingsText}>You&apos;re saving ${discount.toFixed(2)} with promo code</Text>
            </View>
          )}
        </View>
        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          size="large"
          loading={createOrderMutation.isPending}
          disabled={!selectedAddress}
          icon={!createOrderMutation.isPending ? <Check size={20} color="#FFF" /> : undefined}
          style={styles.placeOrderButton}
        />
      </SafeAreaView>

      <Modal
        visible={showPromoModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPromoModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPromoModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Promo Code</Text>
              <Pressable onPress={() => setShowPromoModal(false)}>
                <X size={24} color={Colors.light.text} />
              </Pressable>
            </View>
            <View style={styles.promoInputContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="PROMO CODE"
                placeholderTextColor={Colors.light.textTertiary}
                value={promoCode}
                onChangeText={(text) => {
                  setPromoCode(text.toUpperCase());
                  setPromoError('');
                }}
                autoCapitalize="characters"
                autoFocus
              />
              <Button
                title="Apply"
                onPress={handleApplyPromo}
                disabled={!promoCode.trim()}
              />
            </View>
            {promoError ? (
              <Text style={styles.promoErrorText}>{promoError}</Text>
            ) : null}
            <View style={styles.availablePromos}>
              <Text style={styles.availablePromosTitle}>Available Promo Codes</Text>
              {promoCodes.filter(pc => pc.isActive).slice(0, 3).map(promo => (
                <Pressable 
                  key={promo.id} 
                  style={styles.availablePromoItem}
                  onPress={() => {
                    setPromoCode(promo.code);
                    setPromoError('');
                  }}
                >
                  <View style={styles.availablePromoInfo}>
                    <Text style={styles.availablePromoCode}>{promo.code}</Text>
                    <Text style={styles.availablePromoDesc}>{promo.description}</Text>
                    {promo.minOrderAmount && (
                      <Text style={styles.availablePromoMin}>Min. order: ${promo.minOrderAmount}</Text>
                    )}
                  </View>
                  <View style={styles.useButton}>
                    <Text style={styles.useButtonText}>Use</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  authIcon: {
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
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
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
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  defaultBadge: {
    backgroundColor: `${Colors.light.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.success,
  },
  addressName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  addAddressText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shippingOptionActive: {
    borderColor: Colors.light.secondary,
  },
  shippingRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  shippingRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.secondary,
  },
  shippingInfo: {
    flex: 1,
  },
  shippingName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  shippingDetails: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  shippingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  freePrice: {
    color: Colors.light.success,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.light.secondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  paymentExpiry: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
  },
  promoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.light.secondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  promoPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  appliedPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.light.success}10`,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.success,
  },
  promoIconSuccess: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Colors.light.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  promoInfo: {
    flex: 1,
  },
  promoCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.success,
    marginBottom: 2,
  },
  promoDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  removePromoButton: {
    padding: 8,
  },
  itemsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  orderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  itemQuantity: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
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
    fontSize: 12,
    color: Colors.light.success,
    fontWeight: '500',
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
  discountLabel: {
    fontSize: 14,
    color: Colors.light.success,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.success,
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
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: `${Colors.light.success}10`,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.success,
  },
  placeOrderButton: {
    marginBottom: 8,
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
    maxHeight: '80%',
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
  promoInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  promoInput: {
    flex: 1,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: 1,
  },
  promoErrorText: {
    fontSize: 13,
    color: Colors.light.error,
    marginBottom: 16,
  },
  availablePromos: {
    marginTop: 8,
  },
  availablePromosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  availablePromoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  availablePromoInfo: {
    flex: 1,
  },
  availablePromoCode: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  availablePromoDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  availablePromoMin: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  useButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
  },
  useButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});
