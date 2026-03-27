import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  TextInput,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { 
  Search,
  ChevronRight,
  ChevronDown,
  Package,
  RotateCcw,
  CreditCard,
  User,
  Shield,
  MessageCircle,
  Mail,
  Phone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { helpCategories } from '@/mocks/notifications';

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package size={20} color={Colors.light.secondary} />,
  RotateCcw: <RotateCcw size={20} color={Colors.light.secondary} />,
  CreditCard: <CreditCard size={20} color={Colors.light.secondary} />,
  User: <User size={20} color={Colors.light.secondary} />,
  Shield: <Shield size={20} color={Colors.light.secondary} />,
};

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const handleCategoryPress = useCallback((categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
    setExpandedArticle(null);
  }, []);

  const handleArticlePress = useCallback((articleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedArticle(prev => prev === articleId ? null : articleId);
  }, []);

  const handleContactSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('mailto:support@globaldrop.com');
  }, []);

  const handleCallSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('tel:+18001234567');
  }, []);

  const filteredCategories = searchQuery
    ? helpCategories.map(cat => ({
        ...cat,
        articles: cat.articles.filter(
          a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               a.content.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.articles.length > 0)
    : helpCategories;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Help Center' }} />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.light.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help articles..."
            placeholderTextColor={Colors.light.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Popular Topics</Text>

        {filteredCategories.map(category => (
          <View key={category.id} style={styles.categoryContainer}>
            <Pressable 
              style={styles.categoryHeader}
              onPress={() => handleCategoryPress(category.id)}
            >
              <View style={styles.categoryIcon}>
                {iconMap[category.icon] || <Package size={20} color={Colors.light.secondary} />}
              </View>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <View style={styles.categoryArrow}>
                {expandedCategory === category.id ? (
                  <ChevronDown size={20} color={Colors.light.textTertiary} />
                ) : (
                  <ChevronRight size={20} color={Colors.light.textTertiary} />
                )}
              </View>
            </Pressable>

            {expandedCategory === category.id && (
              <View style={styles.articlesContainer}>
                {category.articles.map(article => (
                  <View key={article.id}>
                    <Pressable 
                      style={styles.articleHeader}
                      onPress={() => handleArticlePress(article.id)}
                    >
                      <Text style={styles.articleTitle}>{article.title}</Text>
                      <View style={styles.articleArrow}>
                        {expandedArticle === article.id ? (
                          <ChevronDown size={16} color={Colors.light.textTertiary} />
                        ) : (
                          <ChevronRight size={16} color={Colors.light.textTertiary} />
                        )}
                      </View>
                    </Pressable>
                    {expandedArticle === article.id && (
                      <View style={styles.articleContent}>
                        <Text style={styles.articleText}>{article.content}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try different keywords or browse categories</Text>
          </View>
        )}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSubtitle}>Our support team is here for you</Text>

          <Pressable style={styles.contactOption} onPress={handleContactSupport}>
            <View style={styles.contactIcon}>
              <Mail size={20} color={Colors.light.secondary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactValue}>support@globaldrop.com</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.textTertiary} />
          </Pressable>

          <Pressable style={styles.contactOption} onPress={handleCallSupport}>
            <View style={styles.contactIcon}>
              <Phone size={20} color={Colors.light.secondary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone Support</Text>
              <Text style={styles.contactValue}>1-800-123-4567</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.textTertiary} />
          </Pressable>

          <Pressable style={styles.liveChatButton}>
            <MessageCircle size={20} color="#FFF" />
            <Text style={styles.liveChatText}>Start Live Chat</Text>
          </Pressable>
        </View>

        <View style={styles.faqNote}>
          <Text style={styles.faqNoteText}>
            Response time: Usually within 24 hours. For urgent matters, please use live chat or phone support.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
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
  categoryContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.light.secondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  categoryArrow: {
    marginLeft: 8,
  },
  articlesContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 70,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  articleTitle: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  articleArrow: {
    marginLeft: 8,
  },
  articleContent: {
    padding: 16,
    paddingLeft: 70,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  articleText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  contactSection: {
    marginTop: 24,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 20,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.light.secondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  contactValue: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  liveChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  liveChatText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  faqNote: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
  },
  faqNoteText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});
