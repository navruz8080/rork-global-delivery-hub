import React, { useState, useCallback } from 'react';
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
import { Stack } from 'expo-router';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Check,
  X,
  Apple,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { paymentMethods as initialPaymentMethods } from '@/mocks/notifications';
import { PaymentMethod, CardType } from '@/types/notifications';

const cardIcons: Record<CardType, { color: string; label: string }> = {
  visa: { color: '#1A1F71', label: 'Visa' },
  mastercard: { color: '#EB001B', label: 'Mastercard' },
  amex: { color: '#006FCF', label: 'American Express' },
  apple_pay: { color: '#000000', label: 'Apple Pay' },
  google_pay: { color: '#4285F4', label: 'Google Pay' },
  paypal: { color: '#003087', label: 'PayPal' },
};

function CardIcon({ type, size = 24 }: { type: CardType; size?: number }) {
  if (type === 'apple_pay') {
    return <Apple size={size} color={cardIcons[type].color} />;
  }
  return <CreditCard size={size} color={cardIcons[type]?.color || Colors.light.text} />;
}

export default function PaymentMethodsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    initialPaymentMethods.map(pm => ({
      ...pm,
      type: pm.type as CardType,
    }))
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderName, setHolderName] = useState('');

  const handleSetDefault = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaymentMethods(prev => 
      prev.map(pm => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
          },
        },
      ]
    );
  }, []);

  const formatCardNumber = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substr(0, 19) : '';
  }, []);

  const formatExpiry = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substr(0, 2) + '/' + cleaned.substr(2, 2);
    }
    return cleaned;
  }, []);

  const handleAddCard = useCallback(() => {
    if (!cardNumber || !expiryDate || !cvv || !holderName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const [month, year] = expiryDate.split('/');
    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
    
    const newCard: PaymentMethod = {
      id: `pm${Date.now()}`,
      type: 'visa',
      last4,
      expiryMonth: parseInt(month, 10),
      expiryYear: 2000 + parseInt(year, 10),
      holderName,
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods(prev => [...prev, newCard]);
    setShowAddModal(false);
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setHolderName('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [cardNumber, expiryDate, cvv, holderName, paymentMethods.length]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Payment Methods' }} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Saved Cards</Text>

        {paymentMethods.map(method => (
          <Pressable 
            key={method.id} 
            style={[styles.cardItem, method.isDefault && styles.cardItemDefault]}
            onPress={() => handleSetDefault(method.id)}
          >
            <View style={styles.cardIcon}>
              <CardIcon type={method.type} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardType}>{cardIcons[method.type]?.label || method.type}</Text>
              {method.last4 ? (
                <>
                  <Text style={styles.cardNumber}>•••• •••• •••• {method.last4}</Text>
                  <Text style={styles.cardExpiry}>
                    Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear.toString().slice(-2)}
                  </Text>
                </>
              ) : (
                <Text style={styles.cardNumber}>Connected</Text>
              )}
            </View>
            <View style={styles.cardActions}>
              {method.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Check size={12} color="#FFF" />
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              ) : (
                <Pressable 
                  style={styles.deleteButton}
                  onPress={() => handleDelete(method.id)}
                >
                  <Trash2 size={18} color={Colors.light.error} />
                </Pressable>
              )}
            </View>
          </Pressable>
        ))}

        {paymentMethods.length === 0 && (
          <View style={styles.emptyState}>
            <CreditCard size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>No payment methods</Text>
            <Text style={styles.emptySubtitle}>Add a card to make checkout faster</Text>
          </View>
        )}

        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <View style={styles.addIcon}>
            <Plus size={20} color={Colors.light.secondary} />
          </View>
          <Text style={styles.addText}>Add New Card</Text>
        </Pressable>

        <View style={styles.securityNote}>
          <Text style={styles.securityTitle}>Your payment info is secure</Text>
          <Text style={styles.securityText}>
            We use industry-standard encryption to protect your payment information. 
            Your full card number is never stored on our servers.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Card</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.light.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={Colors.light.textTertiary}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor={Colors.light.textTertiary}
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiry(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor={Colors.light.textTertiary}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={Colors.light.textTertiary}
                  value={holderName}
                  onChangeText={setHolderName}
                  autoCapitalize="words"
                />
              </View>
            </ScrollView>

            <SafeAreaView edges={['bottom']} style={styles.modalFooter}>
              <Button
                title="Add Card"
                onPress={handleAddCard}
                size="large"
              />
            </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardItemDefault: {
    borderColor: Colors.light.secondary,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: 'monospace',
  },
  cardExpiry: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  defaultText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${Colors.light.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  addText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  securityNote: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
});
