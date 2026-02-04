import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Check,
  X,
  Home,
  Building2,
  Briefcase,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { Address } from '@/types';

const addressLabels = [
  { id: 'home', name: 'Home', icon: Home },
  { id: 'work', name: 'Work', icon: Briefcase },
  { id: 'other', name: 'Other', icon: Building2 },
];

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const LabelIcon = addressLabels.find(l => l.id === address.label.toLowerCase())?.icon || MapPin;

  return (
    <View style={[styles.addressCard, address.isDefault && styles.defaultCard]}>
      {address.isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <View style={styles.labelContainer}>
          <View style={styles.labelIcon}>
            <LabelIcon size={16} color={Colors.light.secondary} />
          </View>
          <Text style={styles.labelText}>{address.label}</Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable style={styles.actionButton} onPress={onEdit}>
            <Edit2 size={16} color={Colors.light.textSecondary} />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={onDelete}>
            <Trash2 size={16} color={Colors.light.error} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.fullName}>{address.fullName}</Text>
      <Text style={styles.addressLine}>{address.street}, {address.building}</Text>
      {address.apartment && <Text style={styles.addressLine}>Apt. {address.apartment}</Text>}
      <Text style={styles.addressLine}>{address.city}, {address.postalCode}</Text>
      <Text style={styles.addressLine}>{address.country}</Text>
      <Text style={styles.phone}>{address.phone}</Text>
      {!address.isDefault && (
        <Pressable style={styles.setDefaultButton} onPress={onSetDefault}>
          <Text style={styles.setDefaultText}>Set as default</Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MapPin size={48} color={Colors.light.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No addresses yet</Text>
      <Text style={styles.emptySubtitle}>Add your delivery addresses for faster checkout</Text>
      <Pressable style={styles.addButton} onPress={onAdd}>
        <Plus size={20} color="#FFF" />
        <Text style={styles.addButtonText}>Add Address</Text>
      </Pressable>
    </View>
  );
}

export default function AddressesScreen() {
  const { user, setUser } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({
    label: 'Home',
    fullName: '',
    phone: '',
    country: '',
    city: '',
    street: '',
    building: '',
    apartment: '',
    postalCode: '',
    isDefault: false,
  });

  const openAddModal = useCallback(() => {
    setEditingAddress(null);
    setFormData({
      label: 'Home',
      fullName: user.firstName + ' ' + user.lastName,
      phone: user.phone || '',
      country: '',
      city: '',
      street: '',
      building: '',
      apartment: '',
      postalCode: '',
      isDefault: user.addresses.length === 0,
    });
    setModalVisible(true);
  }, [user]);

  const openEditModal = useCallback((address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (!formData.fullName || !formData.phone || !formData.city || !formData.street) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const newAddress: Address = {
      id: editingAddress?.id || Date.now().toString(),
      label: formData.label || 'Home',
      fullName: formData.fullName!,
      phone: formData.phone!,
      country: formData.country || 'USA',
      city: formData.city!,
      street: formData.street!,
      building: formData.building || '',
      apartment: formData.apartment,
      postalCode: formData.postalCode || '',
      isDefault: formData.isDefault || false,
    };

    setUser(prev => {
      let addresses = [...prev.addresses];
      
      if (editingAddress) {
        addresses = addresses.map(a => a.id === editingAddress.id ? newAddress : a);
      } else {
        addresses.push(newAddress);
      }

      if (newAddress.isDefault) {
        addresses = addresses.map(a => ({ ...a, isDefault: a.id === newAddress.id }));
      }

      return { ...prev, addresses };
    });

    setModalVisible(false);
  }, [formData, editingAddress, setUser]);

  const handleDelete = useCallback((addressId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            setUser(prev => ({
              ...prev,
              addresses: prev.addresses.filter(a => a.id !== addressId),
            }));
          },
        },
      ]
    );
  }, [setUser]);

  const handleSetDefault = useCallback((addressId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUser(prev => ({
      ...prev,
      addresses: prev.addresses.map(a => ({ ...a, isDefault: a.id === addressId })),
    }));
  }, [setUser]);

  const renderItem = useCallback(({ item }: { item: Address }) => (
    <AddressCard
      address={item}
      onEdit={() => openEditModal(item)}
      onDelete={() => handleDelete(item.id)}
      onSetDefault={() => handleSetDefault(item.id)}
    />
  ), [openEditModal, handleDelete, handleSetDefault]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Delivery Addresses',
          headerRight: () => (
            <Pressable onPress={openAddModal} style={styles.headerButton}>
              <Plus size={24} color={Colors.light.secondary} />
            </Pressable>
          ),
        }} 
      />

      {user.addresses.length === 0 ? (
        <EmptyState onAdd={openAddModal} />
      ) : (
        <FlatList
          data={user.addresses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalVisible(false)}>
              <X size={24} color={Colors.light.text} />
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Edit Address' : 'Add Address'}
            </Text>
            <Pressable onPress={handleSave}>
              <Check size={24} color={Colors.light.secondary} />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.inputLabel}>Label</Text>
            <View style={styles.labelButtons}>
              {addressLabels.map(label => (
                <Pressable
                  key={label.id}
                  style={[
                    styles.labelButton,
                    formData.label?.toLowerCase() === label.id && styles.labelButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, label: label.name }))}
                >
                  <label.icon 
                    size={16} 
                    color={formData.label?.toLowerCase() === label.id ? '#FFF' : Colors.light.textSecondary} 
                  />
                  <Text style={[
                    styles.labelButtonText,
                    formData.label?.toLowerCase() === label.id && styles.labelButtonTextActive,
                  ]}>
                    {label.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              placeholder="John Doe"
              placeholderTextColor={Colors.light.textTertiary}
            />

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="+1 234 567 8900"
              placeholderTextColor={Colors.light.textTertiary}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Country</Text>
            <TextInput
              style={styles.input}
              value={formData.country}
              onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
              placeholder="United States"
              placeholderTextColor={Colors.light.textTertiary}
            />

            <Text style={styles.inputLabel}>City *</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="San Francisco"
              placeholderTextColor={Colors.light.textTertiary}
            />

            <Text style={styles.inputLabel}>Street Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.street}
              onChangeText={(text) => setFormData(prev => ({ ...prev, street: text }))}
              placeholder="123 Main Street"
              placeholderTextColor={Colors.light.textTertiary}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Building</Text>
                <TextInput
                  style={styles.input}
                  value={formData.building}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, building: text }))}
                  placeholder="Bldg A"
                  placeholderTextColor={Colors.light.textTertiary}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Apt/Suite</Text>
                <TextInput
                  style={styles.input}
                  value={formData.apartment}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, apartment: text }))}
                  placeholder="Suite 100"
                  placeholderTextColor={Colors.light.textTertiary}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Postal Code</Text>
            <TextInput
              style={styles.input}
              value={formData.postalCode}
              onChangeText={(text) => setFormData(prev => ({ ...prev, postalCode: text }))}
              placeholder="94102"
              placeholderTextColor={Colors.light.textTertiary}
              keyboardType="number-pad"
            />

            <Pressable 
              style={styles.defaultToggle}
              onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
            >
              <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
                {formData.isDefault && <Check size={14} color="#FFF" />}
              </View>
              <Text style={styles.defaultToggleText}>Set as default address</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerButton: {
    padding: 8,
  },
  listContent: {
    padding: 20,
  },
  separator: {
    height: 12,
  },
  addressCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  defaultCard: {
    borderWidth: 2,
    borderColor: Colors.light.secondary,
  },
  defaultBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${Colors.light.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  fullName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  phone: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  setDefaultButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  setDefaultText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondary,
    textAlign: 'center',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.surface,
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
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  labelButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  labelButtonActive: {
    backgroundColor: Colors.light.secondary,
  },
  labelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  labelButtonTextActive: {
    color: '#FFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
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
  checkboxChecked: {
    backgroundColor: Colors.light.secondary,
    borderColor: Colors.light.secondary,
  },
  defaultToggleText: {
    fontSize: 15,
    color: Colors.light.text,
  },
});
