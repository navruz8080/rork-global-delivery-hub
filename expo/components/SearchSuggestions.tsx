import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { TrendingUp, Clock, Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { SearchSuggestion } from '@/types/notifications';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  onSelectSuggestion: (query: string) => void;
  onClearRecent: () => void;
  onRemoveRecent: (query: string) => void;
}

export default function SearchSuggestions({ 
  suggestions, 
  recentSearches, 
  onSelectSuggestion,
  onClearRecent,
  onRemoveRecent,
}: SearchSuggestionsProps) {
  const handleSelect = useCallback((query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectSuggestion(query);
  }, [onSelectSuggestion]);

  const handleClearRecent = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClearRecent();
  }, [onClearRecent]);

  const handleRemoveRecent = useCallback((query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemoveRecent(query);
  }, [onRemoveRecent]);

  const trendingSuggestions = suggestions.filter(s => s.type === 'trending');

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {recentSearches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Clock size={16} color={Colors.light.textSecondary} />
              <Text style={styles.sectionTitle}>Recent Searches</Text>
            </View>
            <Pressable onPress={handleClearRecent}>
              <Text style={styles.clearText}>Clear all</Text>
            </Pressable>
          </View>
          {recentSearches.slice(0, 5).map((query, index) => (
            <View key={`recent-${index}`} style={styles.suggestionRow}>
              <Pressable 
                style={styles.suggestionContent}
                onPress={() => handleSelect(query)}
              >
                <Clock size={16} color={Colors.light.textTertiary} />
                <Text style={styles.suggestionText}>{query}</Text>
              </Pressable>
              <Pressable 
                style={styles.removeButton}
                onPress={() => handleRemoveRecent(query)}
              >
                <X size={16} color={Colors.light.textTertiary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <TrendingUp size={16} color={Colors.light.secondary} />
            <Text style={styles.sectionTitle}>Trending Now</Text>
          </View>
        </View>
        {trendingSuggestions.map((suggestion) => (
          <Pressable 
            key={suggestion.id}
            style={styles.trendingItem}
            onPress={() => handleSelect(suggestion.query)}
          >
            <Search size={16} color={Colors.light.textTertiary} />
            <View style={styles.trendingContent}>
              <Text style={styles.suggestionText}>{suggestion.query}</Text>
              {suggestion.count && (
                <Text style={styles.searchCount}>
                  {suggestion.count.toLocaleString()} searches
                </Text>
              )}
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Categories</Text>
        <View style={styles.categoriesGrid}>
          {['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Toys'].map((category) => (
            <Pressable 
              key={category}
              style={styles.categoryChip}
              onPress={() => handleSelect(category)}
            >
              <Text style={styles.categoryChipText}>{category}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.secondary,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  suggestionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  removeButton: {
    padding: 8,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  trendingContent: {
    flex: 1,
  },
  searchCount: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
});
