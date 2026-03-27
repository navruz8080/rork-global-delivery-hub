import React, { useCallback, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { 
  Star, 
  MapPin, 
  Shield, 
  Clock, 
  Package,
  MessageCircle,
  TrendingUp,
  Calendar,
  CheckCircle,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import ProductCard from '@/components/ProductCard';
import { trpc } from '@/lib/trpc';
import { sellers } from '@/mocks/products';
import { productReviews } from '@/mocks/notifications';
import { Product } from '@/types';

const sellerCovers: Record<string, string> = {
  s1: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800',
  s2: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
  s3: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800',
  s4: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
  s5: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800',
  s6: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
  s7: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
  s8: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
  s9: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800',
  s10: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800',
};

const sellerLogos: Record<string, string> = {
  s1: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
  s2: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200',
  s3: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
  s4: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
  s5: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=200',
  s6: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200',
  s7: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=200',
  s8: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200',
  s9: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200',
  s10: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200',
};

export default function SellerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');

  const productsQuery = trpc.products.getBySeller.useQuery(
    { sellerId: id || '' },
    { enabled: !!id }
  );

  const seller = useMemo(() => 
    sellers.find(s => s.id === id) || sellers[0],
    [id]
  );
  
  const sellerProducts: Product[] = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const sellerReviews = useMemo(() => 
    productReviews.filter(r => 
      sellerProducts.some((p: Product) => p.id === r.productId)
    ),
    [sellerProducts]
  );

  const handleFollow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(prev => !prev);
  }, []);

  const handleMessage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const totalSales = seller.productCount * 50;
  const memberYear = new Date(seller.joinedDate).getFullYear();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '', headerTransparent: true }} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Image
          source={{ uri: sellerCovers[id || 's1'] || sellerCovers.s1 }}
          style={styles.coverImage}
          contentFit="cover"
        />
        
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: sellerLogos[id || 's1'] || sellerLogos.s1 }}
              style={styles.logo}
              contentFit="cover"
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.sellerName}>{seller.name}</Text>
                {seller.verified && (
                  <View style={styles.verifiedBadge}>
                    <Shield size={12} color="#FFF" fill="#FFF" />
                  </View>
                )}
              </View>
              <View style={styles.locationRow}>
                <MapPin size={14} color={Colors.light.textSecondary} />
                <Text style={styles.location}>{seller.country}</Text>
              </View>
              <View style={styles.ratingRow}>
                <Star size={14} color={Colors.light.rating} fill={Colors.light.rating} />
                <Text style={styles.rating}>{seller.rating}</Text>
                <Text style={styles.reviewCount}>({sellerReviews.length} reviews)</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
            <Pressable style={styles.messageButton} onPress={handleMessage}>
              <MessageCircle size={20} color={Colors.light.secondary} />
              <Text style={styles.messageButtonText}>Message</Text>
            </Pressable>
          </View>

          <Text style={styles.description}>{seller.description}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Package size={20} color={Colors.light.secondary} />
              <Text style={styles.statValue}>{totalSales.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Products Sold</Text>
            </View>
            <View style={styles.statItem}>
              <Users size={20} color={Colors.light.success} />
              <Text style={styles.statValue}>{seller.followers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Clock size={20} color={Colors.light.info} />
              <Text style={styles.statValue}>{seller.responseTime}</Text>
              <Text style={styles.statLabel}>Response</Text>
            </View>
          </View>

          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Calendar size={16} color={Colors.light.textSecondary} />
              <View style={styles.infoCardText}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{memberYear}</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <CheckCircle size={16} color={Colors.light.success} />
              <View style={styles.infoCardText}>
                <Text style={styles.infoLabel}>Products</Text>
                <Text style={styles.infoValue}>{seller.productCount}</Text>
              </View>
            </View>
          </View>

          <View style={styles.badges}>
            {seller.verified && (
              <View style={styles.badge}>
                <Shield size={14} color={Colors.light.verified} />
                <Text style={styles.badgeText}>Verified Seller</Text>
              </View>
            )}
            <View style={styles.badge}>
              <TrendingUp size={14} color={Colors.light.success} />
              <Text style={styles.badgeText}>Top Rated</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <Pressable 
            style={[styles.tab, activeTab === 'products' && styles.tabActive]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
              Products ({sellerProducts.length})
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews ({sellerReviews.length})
            </Text>
          </Pressable>
        </View>

        {activeTab === 'products' ? (
          <View style={styles.productsSection}>
            {productsQuery.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.secondary} />
              </View>
            ) : (
              <>
                <View style={styles.productsGrid}>
                  {sellerProducts.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </View>
                {sellerProducts.length === 0 && (
                  <Text style={styles.noProducts}>No products available</Text>
                )}
              </>
            )}
          </View>
        ) : (
          <View style={styles.reviewsSection}>
            {sellerReviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image 
                    source={{ uri: review.userAvatar }} 
                    style={styles.reviewAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewerName}>{review.userName}</Text>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          size={12} 
                          color={star <= review.rating ? Colors.light.rating : Colors.light.border}
                          fill={star <= review.rating ? Colors.light.rating : 'transparent'}
                        />
                      ))}
                    </View>
                  </View>
                  {review.verified && (
                    <View style={styles.verifiedPurchase}>
                      <CheckCircle size={12} color={Colors.light.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.reviewTitle}>{review.title}</Text>
                <Text style={styles.reviewContent}>{review.content}</Text>
              </View>
            ))}
            {sellerReviews.length === 0 && (
              <Text style={styles.noReviews}>No reviews yet</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  profileSection: {
    backgroundColor: Colors.light.surface,
    marginTop: -40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 0,
  },
  profileHeader: {
    flexDirection: 'row',
    marginTop: -40,
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: Colors.light.surface,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.verified,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  followButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  followingButtonText: {
    color: Colors.light.text,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 12,
    gap: 10,
  },
  infoCardText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.light.textTertiary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.light.secondary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.secondary,
    fontWeight: '600',
  },
  productsSection: {
    padding: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  noProducts: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: 14,
    paddingVertical: 40,
  },
  reviewsSection: {
    padding: 20,
  },
  reviewCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  verifiedPurchase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: Colors.light.success,
    fontWeight: '500',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  reviewContent: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  noReviews: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: 14,
    paddingVertical: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
});
