import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { 
  Package, 
  Tag, 
  TrendingDown, 
  Box, 
  Truck, 
  Star,
  Bell,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Notification, NotificationType } from '@/types/notifications';
import { notifications as mockNotifications } from '@/mocks/notifications';

const notificationIcons: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  order_update: { icon: <Package size={20} color="#3B82F6" />, color: '#3B82F6', bg: '#DBEAFE' },
  promotion: { icon: <Tag size={20} color="#8B5CF6" />, color: '#8B5CF6', bg: '#EDE9FE' },
  price_drop: { icon: <TrendingDown size={20} color="#10B981" />, color: '#10B981', bg: '#D1FAE5' },
  back_in_stock: { icon: <Box size={20} color="#F59E0B" />, color: '#F59E0B', bg: '#FEF3C7' },
  delivery: { icon: <Truck size={20} color="#EF4444" />, color: '#EF4444', bg: '#FEE2E2' },
  review_reminder: { icon: <Star size={20} color="#FFB020" />, color: '#FFB020', bg: '#FEF9C3' },
  system: { icon: <Bell size={20} color={Colors.light.secondary} />, color: Colors.light.secondary, bg: '#FFF0EB' },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const iconConfig = notificationIcons[notification.type];

  return (
    <Pressable 
      style={[styles.notificationItem, !notification.isRead && styles.unreadItem]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
        {notification.imageUrl ? (
          <Image source={{ uri: notification.imageUrl }} style={styles.notificationImage} contentFit="cover" />
        ) : (
          iconConfig.icon
        )}
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.notificationTime}>{formatTimeAgo(notification.createdAt)}</Text>
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>{notification.message}</Text>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
      <ChevronRight size={18} color={Colors.light.textTertiary} />
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Bell size={48} color={Colors.light.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        We&apos;ll notify you when there&apos;s something new
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const handleNotificationPress = useCallback((notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, isRead: true } : n
    ));

    if (notification.orderId) {
      router.push(`/order/${notification.orderId}`);
    } else if (notification.productId) {
      router.push(`/product/${notification.productId}`);
    }
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
    />
  ), [handleNotificationPress]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
          headerRight: () => unreadCount > 0 ? (
            <Pressable onPress={markAllAsRead} style={styles.markAllButton}>
              <Check size={18} color={Colors.light.secondary} />
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : null,
        }} 
      />
      
      {notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondary,
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  unreadItem: {
    backgroundColor: '#FFF9F7',
    borderWidth: 1,
    borderColor: `${Colors.light.secondary}20`,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  notificationImage: {
    width: 48,
    height: 48,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  notificationMessage: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.secondary,
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
  },
});
