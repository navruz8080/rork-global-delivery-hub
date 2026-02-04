export type NotificationType = 
  | 'order_update'
  | 'promotion'
  | 'price_drop'
  | 'back_in_stock'
  | 'delivery'
  | 'review_reminder'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  orderId?: string;
  productId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  createdAt: string;
}

export interface SearchSuggestion {
  id: string;
  query: string;
  type: 'recent' | 'trending' | 'category';
  count?: number;
}

export type DiscountType = 'percentage' | 'fixed' | 'free_shipping';

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  applicableCategories: string[];
}

export type CardType = 'visa' | 'mastercard' | 'amex' | 'apple_pay' | 'google_pay' | 'paypal';

export interface PaymentMethod {
  id: string;
  type: CardType;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
  isDefault: boolean;
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  articles: HelpArticle[];
}
