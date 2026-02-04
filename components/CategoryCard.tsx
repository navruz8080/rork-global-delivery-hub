import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  size?: 'small' | 'medium' | 'large';
}

export default function CategoryCard({ category, size = 'medium' }: CategoryCardProps) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/catalog?category=${category.id}`);
  }, [category.id, router]);

  const dimensions = {
    small: { width: 100, height: 100 },
    medium: { width: 140, height: 140 },
    large: { width: '100%' as const, height: 160 },
  };

  const { width, height } = dimensions[size];

  return (
    <Pressable 
      style={[styles.card, { width, height: typeof height === 'number' ? height : undefined }]} 
      onPress={handlePress}
      testID={`category-card-${category.id}`}
    >
      <Image 
        source={{ uri: category.image }} 
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.name}>{category.name}</Text>
        <Text style={styles.count}>{category.productCount.toLocaleString()} items</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  count: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
});
