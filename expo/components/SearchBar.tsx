import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  showFilter?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({ 
  value, 
  onChangeText, 
  onFilterPress,
  placeholder = 'Search products...',
  showFilter = true,
  autoFocus = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
  }, [onChangeText]);

  const handleFilterPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFilterPress?.();
  }, [onFilterPress]);

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Search size={20} color={Colors.light.textTertiary} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
          returnKeyType="search"
          testID="search-input"
        />
        {value.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <X size={18} color={Colors.light.textTertiary} />
          </Pressable>
        )}
      </View>
      {showFilter && (
        <Pressable style={styles.filterButton} onPress={handleFilterPress}>
          <SlidersHorizontal size={20} color={Colors.light.surface} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  searchContainerFocused: {
    borderColor: Colors.light.secondary,
    backgroundColor: Colors.light.surface,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
