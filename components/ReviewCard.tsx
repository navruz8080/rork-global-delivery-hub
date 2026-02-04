import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Star, ThumbsUp, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Review } from '@/types/notifications';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ReviewCardProps {
  review: Review;
  compact?: boolean;
}

export default function ReviewCard({ review, compact = false }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);
  const [isHelpful, setIsHelpful] = useState(false);

  const handleHelpful = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isHelpful) {
      setHelpfulCount(prev => prev - 1);
    } else {
      setHelpfulCount(prev => prev + 1);
    }
    setIsHelpful(prev => !prev);
  }, [isHelpful]);

  const shouldTruncate = review.content.length > 150 && !isExpanded;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {review.userAvatar ? (
            <Image source={{ uri: review.userAvatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{review.userName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{review.userName}</Text>
              {review.verified && (
                <View style={styles.verifiedBadge}>
                  <Check size={10} color="#FFF" />
                </View>
              )}
            </View>
            <Text style={styles.date}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              size={14}
              color={star <= review.rating ? Colors.light.rating : Colors.light.border}
              fill={star <= review.rating ? Colors.light.rating : 'transparent'}
            />
          ))}
        </View>
      </View>

      {!compact && review.title && (
        <Text style={styles.title}>{review.title}</Text>
      )}

      <Text style={styles.content} numberOfLines={compact ? 2 : undefined}>
        {shouldTruncate ? `${review.content.substring(0, 150)}...` : review.content}
      </Text>

      {review.content.length > 150 && !compact && (
        <Pressable 
          style={styles.expandButton}
          onPress={() => setIsExpanded(prev => !prev)}
        >
          <Text style={styles.expandText}>
            {isExpanded ? 'Show less' : 'Read more'}
          </Text>
          {isExpanded ? (
            <ChevronUp size={14} color={Colors.light.secondary} />
          ) : (
            <ChevronDown size={14} color={Colors.light.secondary} />
          )}
        </Pressable>
      )}

      {review.images && review.images.length > 0 && !compact && (
        <View style={styles.imagesContainer}>
          {review.images.slice(0, 3).map((image, index) => (
            <Image key={index} source={{ uri: image }} style={styles.reviewImage} contentFit="cover" />
          ))}
          {review.images.length > 3 && (
            <View style={styles.moreImages}>
              <Text style={styles.moreImagesText}>+{review.images.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {!compact && (
        <View style={styles.footer}>
          <Pressable 
            style={[styles.helpfulButton, isHelpful && styles.helpfulButtonActive]}
            onPress={handleHelpful}
          >
            <ThumbsUp 
              size={14} 
              color={isHelpful ? Colors.light.secondary : Colors.light.textSecondary} 
              fill={isHelpful ? Colors.light.secondary : 'transparent'}
            />
            <Text style={[styles.helpfulText, isHelpful && styles.helpfulTextActive]}>
              Helpful ({helpfulCount})
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  expandText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondary,
  },
  imagesContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  reviewImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  moreImages: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  helpfulButtonActive: {
    backgroundColor: `${Colors.light.secondary}15`,
  },
  helpfulText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  helpfulTextActive: {
    color: Colors.light.secondary,
  },
});
