import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calculator as CalcIcon, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { trpc } from '@/lib/trpc';

const ROUTES_FROM = [
  { id: 'urumqi', name: '🇨🇳 Китай (Урумчи)', code: 'CN_URUMQI' },
  { id: 'iu', name: '🇨🇳 Китай (Иу)', code: 'CN_IU' },
  { id: 'shymkent', name: '🇰🇿 Казахстан (Шымкент)', code: 'KZ_SHYMKENT' },
  { id: 'tashkent', name: '🇺🇿 Узбекистан (Ташкент)', code: 'UZ_TASHKENT' },
];

const ROUTES_TO = [
  { id: 'dushanbe', name: '🇹🇯 Душанбе', code: 'TJ_DUSHANBE' },
  { id: 'khujand', name: '🇹🇯 Худжанд', code: 'TJ_KHUJAND' },
];

export default function CalculatorScreen() {
  const router = useRouter();
  const [routeFrom, setRouteFrom] = useState<string | null>(null);
  const [routeTo, setRouteTo] = useState<string | null>(null);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('1');

  const calculateMutation = trpc.delivery.calculate.useMutation();

  const handleCalculate = async () => {
    if (!routeFrom || !routeTo) {
      Alert.alert('Error', 'Please select route');
      return;
    }

    if (!length || !width || !height || !weight) {
      Alert.alert('Error', 'Please fill all dimensions');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await calculateMutation.mutateAsync({
        routeFrom,
        routeTo,
        dimensions: {
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
        },
        weight: parseFloat(weight),
        quantity: parseInt(quantity) || 1,
      });

      router.push({
        pathname: '/order/create',
        params: {
          routeFrom,
          routeTo,
          length,
          width,
          height,
          weight,
          quantity,
          price: result.price.toString(),
          totalWeight: result.totalWeight.toString(),
          totalVolume: result.totalVolume.toString(),
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to calculate');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Calculate Delivery</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Route Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Route</Text>
          
          <Text style={styles.label}>From:</Text>
          <View style={styles.routeGrid}>
            {ROUTES_FROM.map((route) => (
              <Pressable
                key={route.id}
                style={[
                  styles.routeButton,
                  routeFrom === route.code && styles.routeButtonActive,
                ]}
                onPress={() => {
                  setRouteFrom(route.code);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.routeButtonText,
                    routeFrom === route.code && styles.routeButtonTextActive,
                  ]}
                >
                  {route.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>To:</Text>
          <View style={styles.routeGrid}>
            {ROUTES_TO.map((route) => (
              <Pressable
                key={route.id}
                style={[
                  styles.routeButton,
                  routeTo === route.code && styles.routeButtonActive,
                ]}
                onPress={() => {
                  setRouteTo(route.code);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.routeButtonText,
                    routeTo === route.code && styles.routeButtonTextActive,
                  ]}
                >
                  {route.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dimensions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dimensions (cm)</Text>
          
          <View style={styles.dimensionsRow}>
            <View style={styles.dimensionInput}>
              <Text style={styles.label}>Length</Text>
              <TextInput
                style={styles.input}
                value={length}
                onChangeText={setLength}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.dimensionInput}>
              <Text style={styles.label}>Width</Text>
              <TextInput
                style={styles.input}
                value={width}
                onChangeText={setWidth}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.dimensionInput}>
              <Text style={styles.label}>Height</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Weight */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weight & Quantity</Text>
          
          <View style={styles.weightRow}>
            <View style={styles.weightInput}>
              <Text style={styles.label}>Weight per item (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.weightInput}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Calculate Button */}
        <Pressable
          style={[
            styles.calculateButton,
            calculateMutation.isPending && styles.calculateButtonDisabled,
          ]}
          onPress={handleCalculate}
          disabled={calculateMutation.isPending}
        >
          {calculateMutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <CalcIcon size={20} color="#FFF" />
              <Text style={styles.calculateButtonText}>Calculate Price</Text>
              <ArrowRight size={20} color="#FFF" />
            </>
          )}
        </Pressable>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  routeButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    borderWidth: 2,
    borderColor: Colors.light.borderLight,
    alignItems: 'center',
  },
  routeButtonActive: {
    borderColor: Colors.light.secondary,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  routeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  routeButtonTextActive: {
    color: Colors.light.secondary,
  },
  dimensionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dimensionInput: {
    flex: 1,
  },
  weightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weightInput: {
    flex: 1,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    marginTop: 8,
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  bottomSpacing: {
    height: 20,
  },
});
